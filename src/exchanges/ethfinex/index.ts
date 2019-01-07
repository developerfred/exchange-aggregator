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
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '..';

const debug = require('debug')('exchange-aggregator:ethfinex');

interface SubscribeMessage {
  event: 'subscribe';
  channel: 'book';
  symbol: string;
  prec: 'R0';
  len?: 25 | 100;
}

const subscribeMessage = (options: Options) => {
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

const getWebsocketUrl = (options: Options) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://api.bitfinex.com/ws/2';
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

export const observeEthfinex = (options: Options) => {
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
};

const normalizeOrderEvent = R.curryN(
  2,
  (options: Options, order: [number, number, number]) => {
    const [id, price, amount] = order;

    const volume = Math.abs(parseFloat((amount as any) as string));
    const type = amount > 0 ? OrderType.BID : OrderType.ASK;

    // TODO: Figure out the right formula here.
    const trade = createPrice(
      createQuantity(options.pair.base, parseFloat((price as any) as string)),
      createQuantity(options.pair.quote, volume),
    );

    const event =
      price === 0 ? NormalizedMessageType.REMOVE : NormalizedMessageType.ADD;

    return {
      event,
      id: (id as any) as string,
      type,
      trade,
      exchange: Exchange.ETHFINEX,
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
        const volume = Math.abs(parseFloat((amount as any) as string));
        const type = amount > 0 ? OrderType.BID : OrderType.ASK;

        // TODO: Figure out the right formula here.
        const trade = createPrice(
          createQuantity(
            options.pair.base,
            parseFloat((price as any) as string),
          ),
          createQuantity(options.pair.quote, volume),
        );

        return {
          id: (id as any) as string,
          type,
          trade,
          exchange: Exchange.ETHFINEX,
        } as Order;
      });

    return {
      event: NormalizedMessageType.SNAPSHOT,
      orders: processed,
    };
  },
);
