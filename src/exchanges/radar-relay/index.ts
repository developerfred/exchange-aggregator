import * as R from 'ramda';
import * as Rx from 'rxjs';
import axios from 'axios';
import {
  takeUntil,
  skipUntil,
  map,
  switchMap,
  retryWhen,
  delay,
  share,
  filter,
  tap,
} from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import {
  WebsocketEvent,
  WebsocketRequestType,
  WebsocketRequestTopic,
  WebsocketAction,
  RadarNewOrder,
  RadarFillOrder,
  RadarCancelOrder,
  RadarRemoveOrder,
  RadarBook,
} from '@radarrelay/types';
import {
  Network,
  Options,
  Exchange,
  FillOrderMessage,
  StandardizedMessageType,
  AddOrderMessage,
  RemoveOrderMessage,
  SnapshotMessage,
  OrderMessage,
  Order,
} from '../../types';

const debug = require('debug')('exchange-aggregator:radar-relay');

interface SubscribeMessage {
  type: 'SUBSCRIBE';
  topic: 'BOOK';
  market: string;
}

const subscribeMessage = (base: string, quote: string) => {
  const baseToken = cleanToken(base);
  const quoteToken = cleanToken(quote);
  const message: SubscribeMessage = {
    type: WebsocketRequestType.SUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${baseToken}-${quoteToken}`,
  };

  return message;
};

const standardizeOrder = (order: any): Order => ({
  price: parseFloat(order.price),
  volume: parseFloat(order.remainingBaseTokenAmount),
  metadata: order,
});

const standardizeNewOrderEvent = (event: RadarNewOrder) =>
  ({
    event: StandardizedMessageType.ADD,
    exchange: Exchange.RADAR_RELAY,
    type: event.order.type,
    id: event.order.orderHash,
    order: standardizeOrder(event.order),
  } as AddOrderMessage);

const standardizeFillOrderEvent = (event: RadarFillOrder) =>
  ({
    event: StandardizedMessageType.FILL,
    exchange: Exchange.RADAR_RELAY,
    type: event.order.type,
    id: event.order.orderHash,
    order: standardizeOrder(event.order),
  } as FillOrderMessage);

const standardizeCancelOrderEvent = (event: RadarCancelOrder) =>
  ({
    event: StandardizedMessageType.REMOVE,
    exchange: Exchange.RADAR_RELAY,
    type: event.orderType,
    id: event.orderHash,
  } as RemoveOrderMessage);

const standardizeRemoveOrderEvent = (event: RadarRemoveOrder) =>
  ({
    event: StandardizedMessageType.REMOVE,
    exchange: Exchange.RADAR_RELAY,
    type: event.orderType,
    id: event.orderHash,
  } as RemoveOrderMessage);

const standardizeSnapshotEvent = (book: RadarBook) =>
  ({
    event: StandardizedMessageType.SNAPSHOT,
    exchange: Exchange.RADAR_RELAY,
    asks: book.asks.map(standardizeOrder),
    bids: book.bids.map(standardizeOrder),
  } as SnapshotMessage);

export const isSnapshotEvent = R.allPass([R.has('asks'), R.has('bids')]) as (
  payload,
) => payload is RadarBook;

export const isOrderEvent = R.allPass([R.has('event'), R.has('action')]) as (
  payload,
) => payload is WebsocketEvent;

export const isNewOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'NEW'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.NEW;
  event: RadarNewOrder;
};

export const isFillOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'FILL'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.FILL;
  event: RadarFillOrder;
};

export const isCancelOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'CANCEL'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.CANCEL;
  event: RadarCancelOrder;
};

export const isRemoveOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'REMOVE'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.CANCEL;
  event: RadarRemoveOrder;
};

const getWebsocketUrl = (network: Network) => {
  switch (network) {
    case Network.KOVAN:
      return 'wss://ws.kovan.radarrelay.com/v2';
    case Network.MAINNET:
      return 'wss://ws.radarrelay.com/v2';
    default:
      throw new Error('Invalid network.');
  }
};

const cleanToken = (token: string) => {
  switch (token) {
    case 'ETH':
      return 'WETH';
    default:
      return token;
  }
};

const getHttpUrl = (base: string, quote: string, network: Network) => {
  const baseToken = cleanToken(base);
  const quoteToken = cleanToken(quote);

  switch (network) {
    case Network.KOVAN:
      return `https://api.kovan.radarrelay.com/v2/markets/${baseToken}-${quoteToken}/book`;
    case Network.MAINNET:
      return `https://api.radarrelay.com/v2/markets/${baseToken}-${quoteToken}/book`;
    default:
      throw new Error('Invalid network.');
  }
};

export const getObservableRadarRelayOrders = ({
  base,
  quote,
  network,
}: Options) => {
  const open$ = new Rx.Subject();
  const close$ = new Rx.Subject();

  const ws$ = webSocket({
    WebSocketCtor: isomorphicWs,
    closeObserver: close$,
    openObserver: open$,
    url: getWebsocketUrl(network),
  });

  open$.subscribe(() => {
    debug('Opening connection.');
    ws$.next(subscribeMessage(base, quote));
  });

  close$.subscribe(() => {
    debug('Closing connection.');
  });

  const socket$ = ws$.pipe(
    retryWhen(errors => {
      debug('Connection error. Retrying after a delay.', errors);
      return errors.pipe(delay(1000));
    }),
  );

  // Send a ping signal after a certain quiet period (no message
  // received within 5 seconds).
  const ping$ = socket$.pipe(
    skipUntil(open$),
    takeUntil(close$),
    switchMap(() => Rx.timer(5000)),
  );

  ping$.subscribe(() => {
    debug('Sending ping signal.');
    ws$.next('ping');
  });

  const snapshot$ = socket$.pipe(
    filter(
      R.allPass([
        R.propEq('type', WebsocketRequestType.SUBSCRIBE),
        R.propEq('topic', WebsocketRequestTopic.BOOK),
      ]),
    ),
    switchMap(() => {
      debug(`Loading snapshot for market ${base}-${quote}.`);
      const url = getHttpUrl(base, quote, network);
      return Rx.from(axios.get(url).then(result => result.data as RadarBook));
    }),
    tap(data => {
      debug(
        'Receiving snapshot (%s bids and %s asks).',
        data.bids.length,
        data.asks.length,
      );
    }),
  );

  const messages$ = socket$.pipe(
    filter(isOrderEvent),
    tap(value => {
      debug('Receiving %s message.', value.action);
    }),
  );

  // TODO: Make it so, that every time we are fetching a new snapshot (every
  // time we (re-)open the connection), the websocket messages are buffered
  // until the snapshot is emitted.
  return Rx.merge(snapshot$, messages$).pipe(share());
};

export const standardizeStream = (
  stream$: ReturnType<typeof getObservableRadarRelayOrders>,
) => {
  const usingEvent = <T, U>(fn: (event: T) => U) =>
    R.compose(
      fn,
      R.prop('event') as (payload: WebsocketEvent) => T,
    );

  return stream$.pipe(
    map(R.cond([
      [isNewOrderEvent, usingEvent(standardizeNewOrderEvent)],
      [isFillOrderEvent, usingEvent(standardizeFillOrderEvent)],
      [isCancelOrderEvent, usingEvent(standardizeCancelOrderEvent)],
      [isRemoveOrderEvent, usingEvent(standardizeRemoveOrderEvent)],
      [isSnapshotEvent, standardizeSnapshotEvent],
    ]) as (
      payload: WebsocketEvent | RadarBook,
    ) => OrderMessage | SnapshotMessage),
  );
};
