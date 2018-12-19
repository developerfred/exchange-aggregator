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
  RadarSignedOrder,
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
} from '../../types';

const debug = require('debug')('exchange-aggregator:radar-relay');

interface SubscribeMessage {
  type: 'SUBSCRIBE';
  topic: 'BOOK';
  market: string;
}

const subscribeMessage = (base: string, quote: string) => {
  const message: SubscribeMessage = {
    type: WebsocketRequestType.SUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${base}-${quote}`,
  };

  return message;
};

const standardizeNewOrderEvent = (event: RadarNewOrder) => {
  return {
    type: StandardizedMessageType.ADD,
    exchange: Exchange.RADAR_RELAY,
    id: event.order.orderHash,
    order: {
      id: event.order.orderHash,
      original: event.order,
    },
  } as AddOrderMessage;
};

const standardizeFillOrderEvent = (event: RadarFillOrder) => {
  return {
    type: StandardizedMessageType.FILL,
    exchange: Exchange.RADAR_RELAY,
    id: event.order.orderHash,
    order: {
      id: event.order.orderHash,
      original: event.order,
    },
  } as FillOrderMessage;
};

const standardizeCancelOrderEvent = (event: RadarCancelOrder) => {
  return {
    type: StandardizedMessageType.REMOVE,
    exchange: Exchange.RADAR_RELAY,
    id: event.orderHash,
  } as RemoveOrderMessage;
};

const standardizeRemoveOrderEvent = (event: RadarRemoveOrder) => {
  return {
    type: StandardizedMessageType.REMOVE,
    exchange: Exchange.RADAR_RELAY,
    id: event.orderHash,
  } as RemoveOrderMessage;
};

const standardizeSnapshotEvent = (book: RadarBook) => {
  return {
    type: StandardizedMessageType.SNAPSHOT,
    exchange: Exchange.RADAR_RELAY,
    snapshot: [].concat(book.asks, book.bids).map((item: RadarSignedOrder) => ({
      // TODO: Add other fields.
      id: item.orderHash,
      original: item,
    })),
  } as SnapshotMessage;
};

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
      return 'wss://ws.radarrelay.com/v2';
    case Network.MAINNET:
      return 'wss://ws.radarrelay.com/v2';
    default:
      throw new Error('Invalid network.');
  }
};

const getHttpUrl = (base: string, quote: string, network: Network) => {
  switch (network) {
    case Network.KOVAN:
      return `https://api.radarrelay.com/v2/markets/${base}-${quote}/book`;
    case Network.MAINNET:
      return `https://api.radarrelay.com/v2/markets/${base}-${quote}/book`;
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
    map(data => {
      debug(
        'Receiving snapshot (%s bids and %s asks).',
        data.bids.length,
        data.asks.length,
      );

      return data;
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
  return Rx.merge(snapshot$, messages$);
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
