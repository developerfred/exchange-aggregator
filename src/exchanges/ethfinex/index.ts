import * as R from 'ramda';
import * as Rx from 'rxjs';
import { tap, filter, map } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import {
  Network,
  Options,
  OrderType,
  Exchange,
  Order,
  RemoveOrderMessage,
  NormalizedMessageType,
  SnapshotMessage,
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '../debug';

const debug = require('debug')('exchange-aggregator:ethfinex');

interface SubscribeMessage {
  event: 'subscribe';
  channel: 'book';
  symbol: string;
  prec: 'R0';
  len?: 25 | 100;
}

const cleanToken = (token: string) => {
  switch (token) {
    case 'WETH':
      return 'ETH';
    default:
      return token;
  }
};

const subscribeMessage = (options: Options) => {
  const base = cleanToken(options.pair.base.symbol);
  const quote = cleanToken(options.pair.quote.symbol);
  const message: SubscribeMessage = {
    event: 'subscribe',
    channel: 'book',
    symbol: `t${base}${quote}`,
    prec: 'R0',
  };

  return message;
};

const getWebsocketUrl = (options: Options) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://api.bitfinex.com/ws/2';
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

export const observeEthfinex = (options: Options) => {
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
      filter(R.is(Array)),
      map(R.nth(1)),
    );

    const snapshots$ = messages$.pipe(
      filter(
        R.compose(
          R.is(Array),
          R.head,
        ),
      ),
      map(normalizeSnapshotEvent(options)),
    );

    const updates$ = messages$.pipe(
      filter(
        R.compose(
          R.is(Number),
          R.head,
        ),
      ),
      map(normalizeOrderEvent(options)),
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

const normalizeOrderEvent = R.curryN(
  2,
  (options: Options, order: [number, number, number]) => {
    const [id, price, amount] = order;
    const oid = Buffer.from(`${Exchange.ETHFINEX}:${id}`).toString('base64');
    const volume = Math.abs(amount);
    const type = amount > 0 ? OrderType.BID : OrderType.ASK;
    const trade = createPrice(
      createQuantity(options.pair.base, volume),
      createQuantity(options.pair.quote, price * volume),
    );

    const event =
      price === 0 ? NormalizedMessageType.REMOVE : NormalizedMessageType.ADD;

    return {
      id: oid,
      event,
      exchange: Exchange.ETHFINEX,
      order: {
        id: oid,
        type,
        trade,
        exchange: Exchange.ETHFINEX,
      },
    } as RemoveOrderMessage;
  },
);

const normalizeSnapshotEvent = R.curryN(
  2,
  (options: Options, orders: [number, number, number][]) => {
    const processed = orders
      .filter(([_, price]) => {
        return price !== 0;
      })
      .map(([id, price, amount]) => {
        const oid = Buffer.from(`${Exchange.ETHFINEX}:${id}`).toString(
          'base64',
        );
        const volume = Math.abs(amount);
        const type = amount > 0 ? OrderType.BID : OrderType.ASK;
        const trade = createPrice(
          createQuantity(options.pair.base, volume),
          createQuantity(options.pair.quote, price * volume),
        );

        return {
          id: oid,
          type,
          trade,
          exchange: Exchange.ETHFINEX,
        } as Order;
      });

    return {
      event: NormalizedMessageType.SNAPSHOT,
      exchange: Exchange.ETHFINEX,
      orders: processed,
    } as SnapshotMessage;
  },
);
