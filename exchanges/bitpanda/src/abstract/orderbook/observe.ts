import * as R from 'ramda';
import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import { OrderbookObserver, Symbol, Orderbook } from '@melonproject/ea-common';
import { subscribe } from '../../api/websocket';
import { share, filter, map } from 'rxjs/operators';
import { fromStandarPair } from '../mapping';
import {
  SubscriptionParams,
  OrderBookMessage,
  OrderBookSnapshotMessage,
  OrderBookUpdateMessage,
} from '../../api/types';

export interface WatchOptions {
  base: Symbol;
  quote: Symbol;
}

const update = (
  subscriber: Rx.Subscriber<Orderbook<Symbol>>,
  // depth: number,
  state: (message: Orderbook<Symbol>) => Orderbook<Symbol>,
) => (message: Orderbook<Symbol>) => {
  const current = state(message);

  current.asks = message.asks
    .reduce((carry, current) => {
      // Temporarily remove the updated price level from the state.
      const out = carry.filter(item => !item.price.isEqualTo(current.price));
      // Only (re-)add the price level if it's not zero.
      return current.volume.isZero() ? out : out.concat(current);
    }, current.asks)
    .sort((a, b) => a.price.comparedTo(b.price));
  // .slice(0, 5);

  current.bids = message.bids
    .reduce((carry, current) => {
      // Temporarily remove the updated price level from the state.
      const out = carry.filter(item => !item.price.isEqualTo(current.price));
      // Only (re-)add the price level if it's not zero.
      return current.volume.isZero() ? out : out.concat(current);
    }, current.bids)
    .sort((a, b) => b.price.comparedTo(a.price));
  // .slice(0, 5);

  subscriber.next({
    quote: current.quote,
    base: current.base,
    asks: current.asks.slice(),
    bids: current.bids.slice(),
  });
};

const snapshot = (
  subscriber: Rx.Subscriber<Orderbook<Symbol>>,
  // depth: number,
  state: (message: Orderbook<Symbol>) => Orderbook<Symbol>,
) => (message: Orderbook<Symbol>) => {
  const current = state(message);

  current.asks = message.asks.sort((a, b) => a.price.comparedTo(b.price));
  // .filter(item => !item.volume.isEqualTo(0))
  // .slice(0, 5);

  current.bids = message.bids.sort((a, b) => b.price.comparedTo(a.price));
  // .filter(item => !item.volume.isEqualTo(0))
  // .slice(0, 5);

  subscriber.next({
    quote: current.quote,
    base: current.base,
    asks: current.asks.slice(),
    bids: current.bids.slice(),
  });
};

export const observe: OrderbookObserver<WatchOptions> = options =>
  new Rx.Observable(subscriber => {
    const pair = fromStandarPair(options);
    const opts = {
      type: 'SUBSCRIBE',
      channels: [
        {
          name: 'ORDER_BOOK',
          instrument_codes: [pair],
        },
      ],
    } as SubscriptionParams;

    const messages$ = subscribe<OrderBookMessage>(opts).pipe(share());

    const state: Orderbook<Symbol> = {
      base: options.base,
      quote: options.quote,
      asks: [],
      bids: [],
    };

    const updates$ = messages$.pipe(
      filter(value => R.equals(value.type, 'ORDER_BOOK_UPDATE')),
      map(message => {
        const update = message as OrderBookUpdateMessage;

        const asks = update.changes
          .filter(value => R.equals(value[0], 'SELL'))
          .map(value => ({
            price: new BigNumber(value[1]),
            volume: new BigNumber(value[2]),
          }));

        const bids = update.changes
          .filter(value => R.equals(value[0], 'BUY'))
          .map(value => ({
            price: new BigNumber(value[1]),
            volume: new BigNumber(value[2]),
          }));

        return { asks, bids };
      }),
    );

    const snapshots$ = messages$.pipe(
      filter(value => R.equals(value.type, 'ORDER_BOOK_SNAPSHOT')),
      map(message => {
        const snpashot = message as OrderBookSnapshotMessage;

        const asks = snpashot.asks.map(value => ({
          price: new BigNumber(value[0]),
          volume: new BigNumber(value[1]),
        }));

        const bids = snpashot.bids.map(value => ({
          price: new BigNumber(value[0]),
          volume: new BigNumber(value[1]),
        }));

        return { asks, bids };
      }),
    );

    const updates = updates$.subscribe(update(subscriber, () => state));
    const snapshots = snapshots$.subscribe(snapshot(subscriber, () => state));

    return () => {
      updates.unsubscribe();
      snapshots.unsubscribe();
    };
  });
