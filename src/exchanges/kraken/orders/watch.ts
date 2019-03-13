import * as R from 'ramda';
import * as Rx from 'rxjs';
import { tap, filter, map, share, flatMap } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import {
  Network,
  Exchange,
  RemoveOrderMessage,
  NormalizedMessageType,
  SnapshotMessage,
  SetOrderMessage,
  AskOrBid,
  Order,
} from '../../../types';
import * as debug from '../../../debug';
import { Kraken } from '../types';
import { cleanEvents } from '../../../utils/cleanEvents';
import { wethToEth } from '../../../utils/wethToEth';
import { KrakenOrder, normalizeOrder } from './common';
import { isZero } from '@melonproject/token-math';

interface SubscribeMessage {
  event: 'subscribe';
  pair: string[];
  subscription: {
    name?: string;
    interval?: number;
    depth?: number;
  };
}

const subscribeMessage = (options: Kraken.WatchOptions) => {
  const base = wethToEth(options.pair.base.symbol);
  const quote = wethToEth(options.pair.quote.symbol);
  const message: SubscribeMessage = {
    event: 'subscribe',
    pair: [`${base}/${quote}`],
    subscription: {
      name: 'book',
    },
  };

  return message;
};

const getWebsocketUrl = (options: Kraken.WatchOptions) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://ws.kraken.com';
    default:
      throw new Error('Invalid network.');
  }
};

const normalizeUpdateEvent = (
  options: Kraken.WatchOptions,
  message: KrakenUpdateMessage,
) => {
  const bids = !!message.b
    ? message.b.map(order => normalizeOrder(options, AskOrBid.BID, order))
    : [];

  const asks = !!message.a
    ? message.a.map(order => normalizeOrder(options, AskOrBid.ASK, order))
    : [];

  return ([].concat(bids, asks) as Order[]).map(order => {
    if (isZero(order.trade.base.quantity)) {
      return {
        id: order.id,
        event: NormalizedMessageType.REMOVE,
        exchange: Exchange.KRAKEN,
        network: options.network,
        base: options.pair.base,
        quote: options.pair.quote,
      } as RemoveOrderMessage;
    }

    return {
      order,
      id: order.id,
      event: NormalizedMessageType.SET,
      exchange: Exchange.KRAKEN,
      network: options.network,
      base: options.pair.base,
      quote: options.pair.quote,
    } as SetOrderMessage;
  });
};

const normalizeSnapshotEvent = (
  options: Kraken.WatchOptions,
  message: KrakenSnapshotMessage,
) => {
  const bids = !!message.bs
    ? message.bs.map(order => normalizeOrder(options, AskOrBid.BID, order))
    : [];

  const asks = !!message.as
    ? message.as.map(order => normalizeOrder(options, AskOrBid.ASK, order))
    : [];

  return {
    event: NormalizedMessageType.SNAPSHOT,
    exchange: Exchange.KRAKEN,
    network: options.network,
    base: options.pair.base,
    quote: options.pair.quote,
    orders: [].concat(bids, asks),
  } as SnapshotMessage;
};

interface KrakenUpdateMessage {
  a?: KrakenOrder[];
  b?: KrakenOrder[];
}

interface KrakenSnapshotMessage {
  as?: KrakenOrder[];
  bs?: KrakenOrder[];
}

export const watch = (options: Kraken.WatchOptions) => {
  const ws$ = new Rx.Observable(observer => {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    const ws$ = webSocket({
      WebSocketCtor: isomorphicWs,
      closeObserver: close$,
      openObserver: open$,
      url: getWebsocketUrl(options),
    });

    ws$.next(subscribeMessage(options));
    open$.subscribe(() => {
      debug.log('Opening connection.');
    });

    close$.subscribe(() => {
      debug.log('Closing connection.');
    });

    return ws$.subscribe(observer);
  }).pipe(share());

  const messages$ = ws$.pipe(
    filter(R.is(Array) as (
      payload: any,
    ) => payload is [number, KrakenUpdateMessage | KrakenSnapshotMessage]),
    map(R.nth(1)),
  );

  const snapshots$ = messages$.pipe(
    filter(R.cond([[R.has('as'), R.T], [R.has('bs'), R.T], [R.T, R.F]]) as (
      payload: any,
    ) => payload is KrakenSnapshotMessage),
    map(message => normalizeSnapshotEvent(options, message)),
  );

  const updates$ = messages$.pipe(
    filter(R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]) as (
      payload: any,
    ) => payload is KrakenUpdateMessage),
    flatMap(message => normalizeUpdateEvent(options, message)),
  );

  return Rx.merge(snapshots$, updates$).pipe(
    tap(event => debug.log('Source event: %e', event)),
    cleanEvents(),
    tap(event => debug.log('Output event: %e', event)),
  );
};
