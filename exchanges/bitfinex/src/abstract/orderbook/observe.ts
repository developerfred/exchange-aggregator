import * as Rx from 'rxjs';
import { OrderbookObserver, Orderbook, Symbol } from '@melonproject/ea-common';
import {
  watchAssetPair,
  SubscriptionOptionsWithoutSymbol,
  TradingPairBookEntry,
} from '../../api/public/websocket/book';
import { share, filter } from 'rxjs/operators';

const defaults = {
  length: 25,
};

interface WatchOptions {
  length?: SubscriptionOptionsWithoutSymbol['length'];
  base: Symbol;
  quote: Symbol;
}

export const observe: OrderbookObserver<WatchOptions> = options =>
  new Rx.Observable(subscriber => {
    const state: Orderbook<Symbol> = {
      base: options.base,
      quote: options.quote,
      asks: [],
      bids: [],
    };

    const opts = {
      ...defaults,
      ...(options.length && { length: options.length }),
    } as SubscriptionOptionsWithoutSymbol;

    const messages$ = watchAssetPair(`${options.base}/${options.quote}`, opts).pipe(share());
    const updates$ = messages$.pipe(filter(message => !Array.isArray(message)));
    const snapshots$ = messages$.pipe(filter(message => Array.isArray(message)));

    const updates = updates$.subscribe((event: TradingPairBookEntry) => {
      const volume = event.count.isZero() ? event.count : event.amount.abs();

      const bids = event.amount.isPositive()
        ? [
            {
              price: event.price,
              volume,
            },
          ]
        : [];

      const asks = event.amount.isNegative()
        ? [
            {
              price: event.price,
              volume,
            },
          ]
        : [];

      state.asks = asks
        .reduce((carry, current) => {
          // Temporarily remove the updated price level from the state.
          const out = carry.filter(item => !item.price.isEqualTo(current.price));
          // Only (re-)add the price level if it's not zero.
          return current.volume.isZero() ? out : out.concat(current);
        }, state.asks)
        .sort((a, b) => a.price.comparedTo(b.price))
        .slice(0, options.length);

      state.bids = bids
        .reduce((carry, current) => {
          // Temporarily remove the updated price level from the state.
          const out = carry.filter(item => !item.price.isEqualTo(current.price));
          // Only (re-)add the price level if it's not zero.
          return current.volume.isZero() ? out : out.concat(current);
        }, state.asks)
        .sort((a, b) => b.price.comparedTo(a.price))
        .slice(0, options.length);

      subscriber.next({
        quote: state.quote,
        base: state.base,
        asks: state.asks.slice(),
        bids: state.bids.slice(),
      });
    });

    const snapshots = snapshots$.subscribe((event: TradingPairBookEntry[]) => {
      state.bids = event
        .filter(item => item.amount.isPositive())
        .map(item => ({
          price: item.price,
          volume: item.amount,
        }))
        .slice(0, opts.length);

      state.asks = event
        .filter(item => item.amount.isNegative())
        .map(item => ({
          price: item.price,
          volume: item.amount.abs(),
        }))
        .slice(0, opts.length);

      subscriber.next({
        quote: state.quote,
        base: state.base,
        asks: state.asks.slice(),
        bids: state.bids.slice(),
      });
    });

    return () => {
      updates.unsubscribe();
      snapshots.unsubscribe();
    };
  });
