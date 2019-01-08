import * as R from 'ramda';
import * as Rx from 'rxjs';
import axios from 'axios';
import { map, switchMap, filter, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
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
  NormalizedMessageType,
  RemoveOrderMessage,
  SnapshotMessage,
  OrderMessage,
  Order,
  OrderType,
  AddOrUpdateOrderMessage,
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '../debug';

const debug = require('debug')('exchange-aggregator:radar-relay');

interface SubscribeMessage {
  type: WebsocketRequestType.SUBSCRIBE;
  topic: WebsocketRequestTopic.BOOK;
  market: string;
  requestId: number;
}

interface UnSubscribeMessage {
  type: WebsocketRequestType.UNSUBSCRIBE;
  topic: WebsocketRequestTopic.BOOK;
  market: string;
}

const subscribeMessage = (options: Options, id: number) => {
  const baseToken = cleanToken(options.pair.base.symbol);
  const quoteToken = cleanToken(options.pair.quote.symbol);
  const message: SubscribeMessage = {
    type: WebsocketRequestType.SUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${baseToken}-${quoteToken}`,
    requestId: id,
  };

  return message;
};

const unSubscribeMessage = (options: Options) => {
  const baseToken = cleanToken(options.pair.base.symbol);
  const quoteToken = cleanToken(options.pair.quote.symbol);
  const message: UnSubscribeMessage = {
    type: WebsocketRequestType.UNSUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${baseToken}-${quoteToken}`,
  };

  return message;
};

const normalizeOrder = R.curryN(
  2,
  (options: Options, order: RadarSignedOrder): Order => {
    const base = parseFloat((order.remainingBaseTokenAmount as any) as string);
    const quote = parseFloat(
      (order.remainingQuoteTokenAmount as any) as string,
    );
    const price = createPrice(
      createQuantity(options.pair.base, base),
      createQuantity(options.pair.quote, quote),
    );

    return {
      id: order.orderHash,
      type: (order.type as any) as OrderType,
      exchange: Exchange.RADAR_RELAY,
      trade: price,
    };
  },
);

const normalizeNewOrderEvent = R.curryN(
  2,
  (options: Options, event: RadarNewOrder): AddOrUpdateOrderMessage => ({
    event: NormalizedMessageType.ADD,
    exchange: Exchange.RADAR_RELAY,
    id: event.order.orderHash,
    order: normalizeOrder(options, event.order),
  }),
);

const normalizeFillOrderEvent = R.curryN(
  2,
  (options: Options, event: RadarFillOrder): AddOrUpdateOrderMessage => ({
    event: NormalizedMessageType.ADD,
    exchange: Exchange.RADAR_RELAY,
    id: event.order.orderHash,
    order: normalizeOrder(options, event.order),
  }),
);

const normalizeCancelOrderEvent = (
  event: RadarCancelOrder,
): RemoveOrderMessage => ({
  event: NormalizedMessageType.REMOVE,
  exchange: Exchange.RADAR_RELAY,
  id: event.orderHash,
});

const normalizeRemoveOrderEvent = (
  event: RadarRemoveOrder,
): RemoveOrderMessage => ({
  event: NormalizedMessageType.REMOVE,
  exchange: Exchange.RADAR_RELAY,
  id: event.orderHash,
});

const normalizeSnapshotEvent = R.curryN(
  2,
  (options: Options, book: RadarBook): SnapshotMessage => ({
    event: NormalizedMessageType.SNAPSHOT,
    exchange: Exchange.RADAR_RELAY,
    orders: [].concat(
      book.asks.map(normalizeOrder(options)),
      book.bids.map(normalizeOrder(options)),
    ),
  }),
);

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

const websocketConnections: {
  [key: string]: WebSocketSubject<WebsocketEvent | RadarBook>;
} = {
  [Network.KOVAN]: undefined,
  [Network.MAINNET]: undefined,
};

const getWebsocketConnection = (options: Options) => {
  if (typeof websocketConnections[options.network] !== 'undefined') {
    return websocketConnections[options.network];
  }

  const open$ = new Rx.Subject();
  const close$ = new Rx.Subject();

  const url = getWebsocketUrl(options);
  const connection$ = webSocket<WebsocketEvent | RadarBook>({
    WebSocketCtor: isomorphicWs,
    closeObserver: close$,
    openObserver: open$,
    url,
  });

  open$.subscribe(() => {
    debug('Opening connection.');
  });

  close$.subscribe(() => {
    debug('Closing connection.');
  });

  return (websocketConnections[options.network] = connection$);
};

let requestId = 0;
const getRequestId = () => {
  return (requestId = requestId + 1);
};

const getWebsocketUrl = (options: Options) => {
  switch (options.network) {
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

const getHttpUrl = (options: Options) => {
  const base = cleanToken(options.pair.base.symbol);
  const quote = cleanToken(options.pair.quote.symbol);

  switch (options.network) {
    case Network.KOVAN: {
      const prefix = 'https://api.kovan.radarrelay.com';
      return `${prefix}/v2/markets/${base}-${quote}/book`;
    }

    case Network.MAINNET: {
      const prefix = 'https://api.kovan.radarrelay.com';
      return `${prefix}/v2/markets/${base}-${quote}/book`;
    }

    default:
      throw new Error('Invalid network.');
  }
};

export const observeRadarRelay = (options: Options) => {
  const id = getRequestId();
  const ws$ = getWebsocketConnection(options);
  const socket$ = ws$.multiplex(
    () => subscribeMessage(options, id),
    () => unSubscribeMessage(options),
    R.propEq('requestId', id),
  );

  const snapshot$ = socket$.pipe(
    filter(R.propEq('type', WebsocketRequestType.SUBSCRIBE)),
    tap(() => {
      const base = options.pair.base.symbol;
      const quote = options.pair.quote.symbol;
      debug(`Loading snapshot for market %s-%s.`, base, quote);
    }),
    switchMap(() => {
      const url = getHttpUrl(options);
      return Rx.from(axios.get(url).then(result => result.data as RadarBook));
    }),
  );

  const messages$ = ws$.pipe(filter(isOrderEvent));

  // TODO: Make it so, that every time we are fetching a new snapshot (every
  // time we (re-)open the connection), the websocket messages are buffered
  // until the snapshot is emitted.
  const events$ = Rx.merge(snapshot$, messages$);

  return events$.pipe(
    map(R.cond([
      [isSnapshotEvent, data => normalizeSnapshotEvent(options, data)],
      [isNewOrderEvent, data => normalizeNewOrderEvent(options, data.event)],
      [isFillOrderEvent, data => normalizeFillOrderEvent(options, data.event)],
      [isCancelOrderEvent, data => normalizeCancelOrderEvent(data.event)],
      [isRemoveOrderEvent, data => normalizeRemoveOrderEvent(data.event)],
    ]) as (
      payload: WebsocketEvent | RadarBook,
    ) => OrderMessage | SnapshotMessage),
    tap(value => {
      debug(...debugEvent(value));
    }),
  );
};
