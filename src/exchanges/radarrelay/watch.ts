import * as R from 'ramda';
import * as Rx from 'rxjs';
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
} from '@radarrelay/types';
import {
  Network,
  Options,
  Exchange,
  NormalizedMessageType,
  RemoveOrderMessage,
  SnapshotMessage,
  OrderMessage,
  SetOrderMessage,
} from '../../types';
import { debugEvent } from '../../debug';
import { normalizeOrder, fetchRadarBook } from './common';

const debug = require('debug')('exchange-aggregator:radar-relay');

interface SubscribeMessage {
  type: WebsocketRequestType.SUBSCRIBE;
  topic: WebsocketRequestTopic.BOOK;
  market: string;
  requestId: number;
}

interface UnsubscribeMessage {
  type: WebsocketRequestType.UNSUBSCRIBE;
  topic: WebsocketRequestTopic.BOOK;
  market: string;
}

const subscribeMessage = (options: Options, id: number) => {
  const baseToken = options.pair.base.symbol;
  const quoteToken = options.pair.quote.symbol;
  const message: SubscribeMessage = {
    type: WebsocketRequestType.SUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${baseToken}-${quoteToken}`,
    requestId: id,
  };

  return message;
};

const unsubscribeMessage = (options: Options) => {
  const baseToken = options.pair.base.symbol;
  const quoteToken = options.pair.quote.symbol;
  const message: UnsubscribeMessage = {
    type: WebsocketRequestType.UNSUBSCRIBE,
    topic: WebsocketRequestTopic.BOOK,
    market: `${baseToken}-${quoteToken}`,
  };

  return message;
};

const normalizeNewOrderEvent = (
  options: Options,
  event: RadarNewOrder,
): SetOrderMessage => {
  const oid = Buffer.from(event.order.orderHash).toString('base64');

  return {
    id: oid,
    event: NormalizedMessageType.SET,
    exchange: Exchange.RADAR_RELAY,
    order: normalizeOrder(options, event.order),
  };
};

const normalizeFillOrderEvent = (
  options: Options,
  event: RadarFillOrder,
): SetOrderMessage => {
  const oid = Buffer.from(event.order.orderHash).toString('base64');

  return {
    id: oid,
    event: NormalizedMessageType.SET,
    exchange: Exchange.RADAR_RELAY,
    order: normalizeOrder(options, event.order),
  };
};

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

const normalizeSnapshotEvent = (
  options: Options,
  book: RadarBook,
): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.RADAR_RELAY,
  orders: [].concat(
    book.asks.map(order => normalizeOrder(options, order)),
    book.bids.map(order => normalizeOrder(options, order)),
  ),
});

const isSnapshotEvent = R.allPass([R.has('asks'), R.has('bids')]) as (
  payload,
) => payload is RadarBook;

const isOrderEvent = R.allPass([R.has('event'), R.has('action')]) as (
  payload,
) => payload is WebsocketEvent;

const isNewOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'NEW'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.NEW;
  event: RadarNewOrder;
};

const isFillOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'FILL'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.FILL;
  event: RadarFillOrder;
};

const isCancelOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('action', 'CANCEL'),
]) as (
  payload: WebsocketEvent,
) => payload is {
  action: WebsocketAction.CANCEL;
  event: RadarCancelOrder;
};

const isRemoveOrderEvent = R.allPass([
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

export const watch = (options: Options) => {
  const ws$ = new Rx.Observable(observer => {
    const id = getRequestId();
    const ws$ = getWebsocketConnection(options);
    const socket$ = ws$.multiplex(
      () => subscribeMessage(options, id),
      () => unsubscribeMessage(options),
      R.propEq('requestId', id),
    );

    return socket$.subscribe(observer);
  });

  const snapshot$ = ws$.pipe(
    filter(R.propEq('type', WebsocketRequestType.SUBSCRIBE)),
    tap(() => {
      const base = options.pair.base.symbol;
      const quote = options.pair.quote.symbol;
      debug(`Loading snapshot for market %s-%s.`, base, quote);
    }),
    switchMap(() => fetchRadarBook(options)),
  );

  // TODO: Make it so, that every time we are fetching a new snapshot (every
  // time we (re-)open the connection), the websocket messages are buffered
  // until the snapshot is emitted.
  const messages$ = ws$.pipe(filter(isOrderEvent));
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
    tap(debugEvent(debug)),
  );
};