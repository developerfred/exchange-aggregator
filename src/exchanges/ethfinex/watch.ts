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
} from '../../types';
import { debugEvent } from '../../debug';
import { normalizeOrder, EthfinexOrder } from './common';
import { Ethfinex } from './types';

const debug = require('debug')('exchange-aggregator:ethfinex');

interface SubscribeMessage {
  event: 'subscribe';
  channel: 'book';
  symbol: string;
  prec: 'R0';
  len?: 25 | 100;
}

const subscribeMessage = (options: Ethfinex.WatchOptions) => {
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;
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
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

const normalizeOrderEvent = (
  options: Ethfinex.WatchOptions,
  order: EthfinexOrder,
) => {
  const [, price] = order;
  const normalized = normalizeOrder(options, order);
  const event =
    price === 0 ? NormalizedMessageType.REMOVE : NormalizedMessageType.SET;

  return {
    id: normalized.id,
    event,
    exchange: Exchange.ETHFINEX,
    order: normalized,
  } as RemoveOrderMessage;
};

const normalizeSnapshotEvent = (
  options: Ethfinex.WatchOptions,
  orders: EthfinexOrder[],
) => {
  const processed = orders
    .filter(([, price]) => price !== 0)
    .map(order => normalizeOrder(options, order));

  return {
    event: NormalizedMessageType.SNAPSHOT,
    exchange: Exchange.ETHFINEX,
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
      debug('Opening connection.');
    });

    close$.subscribe(() => {
      debug('Closing connection.');
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

  return Rx.merge(snapshots$, updates$).pipe(tap(debugEvent(debug)));
};
