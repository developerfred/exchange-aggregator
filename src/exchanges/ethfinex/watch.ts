import * as R from 'ramda';
import * as Rx from 'rxjs';
import { tap, filter, map, share } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import {
  Network,
  Exchange,
  RemoveOrderMessage,
  NormalizedMessageType,
  SnapshotMessage,
  SetOrderMessage,
} from '../../types';
import * as debug from '../../debug';
import { EthfinexOrder, normalizeOrder, orderId } from './common';
import { Ethfinex } from './types';
import { cleanEvents } from '../../utils/cleanEvents';
import { wethToEth } from '../../utils/wethToEth';

interface SubscribeMessage {
  event: 'subscribe';
  channel: 'book';
  symbol: string;
  prec: 'R0';
  len?: 25 | 100;
}

const subscribeMessage = (options: Ethfinex.WatchOptions) => {
  const base = wethToEth(options.base);
  const quote = wethToEth(options.quote);
  const message: SubscribeMessage = {
    event: 'subscribe',
    channel: 'book',
    symbol: `t${base}${quote}`,
    prec: 'R0',
  };

  return message;
};

const getWebsocketUrl = (options: Ethfinex.WatchOptions) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://api.ethfinex.com/ws/2';
    case Network.KOVAN:
      return 'wss://kovan.api.ethfinex.com/ws/2';
    default:
      throw new Error('Invalid network.');
  }
};

const normalizeOrderEvent = (
  options: Ethfinex.WatchOptions,
  order: EthfinexOrder,
) => {
  const [, price] = order;
  const id = orderId(order);

  if (price === 0) {
    return {
      id,
      event: NormalizedMessageType.REMOVE,
      exchange: Exchange.ETHFINEX,
      network: options.network,
      base: options.base,
      quote: options.quote,
    } as RemoveOrderMessage;
  }

  return {
    id,
    event: NormalizedMessageType.SET,
    exchange: Exchange.ETHFINEX,
    network: options.network,
    base: options.base,
    quote: options.quote,
    order: normalizeOrder(options, order, id),
  } as SetOrderMessage;
};

const normalizeSnapshotEvent = (
  options: Ethfinex.WatchOptions,
  orders: EthfinexOrder[],
) => {
  const processed = orders
    .filter(([, price]) => price !== 0)
    .map(order => {
      const id = orderId(order);
      return normalizeOrder(options, order, id);
    });

  return {
    event: NormalizedMessageType.SNAPSHOT,
    exchange: Exchange.ETHFINEX,
    network: options.network,
    base: options.base,
    quote: options.quote,
    orders: processed,
  } as SnapshotMessage;
};

export const watch = (options: Ethfinex.WatchOptions) => {
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
    ) => payload is [number, EthfinexOrder | EthfinexOrder[]]),
    map(R.nth(1)),
  );

  const snapshots$ = messages$.pipe(
    filter(R.compose(
      R.is(Array),
      R.head,
    ) as (payload: any) => payload is EthfinexOrder[]),
    map(orders => normalizeSnapshotEvent(options, orders)),
  );

  const updates$ = messages$.pipe(
    filter(R.compose(
      R.is(Number),
      R.head,
    ) as (payload: any) => payload is EthfinexOrder),
    map(order => normalizeOrderEvent(options, order)),
  );

  return Rx.merge(snapshots$, updates$).pipe(
    tap(event => debug.log('Source event: %e', event)),
    cleanEvents(),
    tap(event => debug.log('Output event: %e', event)),
  );
};
