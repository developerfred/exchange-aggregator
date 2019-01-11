import * as R from 'ramda';
import * as Rx from 'rxjs';
import axios from 'axios';
import { tap, filter, map } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import {
  Network,
  Options,
  OrderType,
  Exchange,
  RemoveOrderMessage,
  NormalizedMessageType,
  SnapshotMessage,
  Order,
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '../debug';

const debug = require('debug')('exchange-aggregator:ethfinex');

export interface EthfinexOptions extends Options {
  // Nothing to extend for now.
}

type EthfinexOrder = [number, number, number];

interface SubscribeMessage {
  event: 'subscribe';
  channel: 'book';
  symbol: string;
  prec: 'R0';
  len?: 25 | 100;
}

const wethToEth = (token: string) => token.replace(/^WETH$/, 'ETH');

const subscribeMessage = (options: EthfinexOptions) => {
  const base = wethToEth(options.pair.base.symbol);
  const quote = wethToEth(options.pair.quote.symbol);
  const message: SubscribeMessage = {
    event: 'subscribe',
    channel: 'book',
    symbol: `t${base}${quote}`,
    prec: 'R0',
  };

  return message;
};

const getWebsocketUrl = (options: EthfinexOptions) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://api.ethfinex.com/ws/2';
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

const getHttpUrl = (options: EthfinexOptions) => {
  const base = wethToEth(options.pair.base.symbol);
  const quote = wethToEth(options.pair.quote.symbol);

  switch (options.network) {
    case Network.MAINNET:
      return `https://api.ethfinex.com/v2/book/t${base}${quote}/R0`;
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

const normalizeOrder = (options: EthfinexOptions, order: EthfinexOrder) => {
  const [id, price, amount] = order;
  const key = `${Exchange.ETHFINEX}:${id}`;
  const volume = Math.abs(amount);

  return {
    id: Buffer.from(key).toString('base64'),
    type: amount > 0 ? OrderType.BID : OrderType.ASK,
    exchange: Exchange.ETHFINEX,
    trade: createPrice(
      createQuantity(options.pair.base, volume),
      createQuantity(options.pair.quote, price * volume),
    ),
  } as Order;
};

const normalizeOrderEvent = (
  options: EthfinexOptions,
  order: EthfinexOrder,
) => {
  const [, price] = order;
  const normalized = normalizeOrder(options, order);
  const event =
    price === 0 ? NormalizedMessageType.REMOVE : NormalizedMessageType.ADD;

  return {
    id: normalized.id,
    event,
    exchange: Exchange.ETHFINEX,
    order: normalized,
  } as RemoveOrderMessage;
};

const normalizeSnapshotEvent = (
  options: EthfinexOptions,
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

export const fetchEtfinexOrders = async (
  options: EthfinexOptions,
): Promise<Order[]> => {
  const { data } = await axios.get(getHttpUrl(options));
  return data.map((order: EthfinexOrder) => normalizeOrder(options, order));
};

export const observeEthfinex = (options: EthfinexOptions) => {
  try {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();
    const url = getWebsocketUrl(options);

    const ws$ = webSocket({
      WebSocketCtor: isomorphicWs,
      closeObserver: close$,
      openObserver: open$,
      url,
    });

    ws$.next(subscribeMessage(options));
    open$.subscribe(() => {
      debug('Opening connection.');
    });

    close$.subscribe(() => {
      debug('Closing connection.');
    });

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
      tap(value => {
        debug(...debugEvent(value as any));
      }),
    );
  } catch (error) {
    return Rx.throwError(error);
  }
};
