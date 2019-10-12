import * as R from 'ramda';
import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import { filter, map, share, switchMap, retryWhen, tap, delay } from 'rxjs/operators';
import { OrderbookObserver, Orderbook, Symbol, OrderbookEntry } from '@melonproject/ea-common';
import { subscribe } from '../../api/websocket';
import { fromStandarPair } from '../mapping';
import { BookUpdateMessage, BookMessage, SubscriptionParams, BookSnapshotMessage } from '../../api/types';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
  base: Symbol;
  quote: Symbol;
}

const isSnapshot = R.compose(
  R.cond([[R.has('as'), R.T], [R.has('bs'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (payload: [string, BookMessage]) => payload is [string, BookSnapshotMessage];

const isUpdate = R.compose(
  R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (payload: [string, BookMessage]) => payload is [string, BookUpdateMessage];

interface UpdateOrderbookEntry extends OrderbookEntry {
  republish: boolean;
}

interface UpdateMessage {
  asks: UpdateOrderbookEntry[];
  bids: UpdateOrderbookEntry[];
}

const update = (depth: number, state: Orderbook<Symbol>) => (message: UpdateMessage) => {
  state.asks = message.asks
    .reduce((carry, ask) => {
      // Check for invalid deletes (deletes of price levels that were not in the orderbook).
      if (ask.volume.isZero() && !carry.find(item => item.price.isEqualTo(ask.price))) {
        throw new IncosistencyError();
      }

      // Check for invalid republishes (republishes of price levels that were already in the orderbook).
      if (ask.republish && carry.find(item => item.price.isEqualTo(ask.price))) {
        throw new IncosistencyError();
      }

      // Temporarily remove the updated price level from the state.
      const out = carry.filter(item => !item.price.isEqualTo(ask.price));
      // Only (re-)add the price level if it's not zero.
      return ask.volume.isZero() ? out : out.concat({ price: ask.price, volume: ask.volume });
    }, state.asks)
    .sort((a, b) => a.price.comparedTo(b.price))
    .slice(0, depth);

  state.bids = message.bids
    .reduce((carry, bid) => {
      // Check for invalid deletes (deletes of price levels that were not in the orderbook).
      if (bid.volume.isZero() && !carry.find(item => item.price.isEqualTo(bid.price))) {
        throw new IncosistencyError();
      }

      // Check for invalid republishes (republishes of price levels that were already in the orderbook).
      if (bid.republish && carry.find(item => item.price.isEqualTo(bid.price))) {
        throw new IncosistencyError();
      }

      // Temporarily remove the updated price level from the state.
      const out = carry.filter(item => !item.price.isEqualTo(bid.price));
      // Only (re-)add the price level if it's not zero.
      return bid.volume.isZero() ? out : out.concat({ price: bid.price, volume: bid.volume });
    }, state.bids)
    .sort((a, b) => b.price.comparedTo(a.price))
    .slice(0, depth);

  return state;
};

interface SnapshotMessage {
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
}

const snapshot = (depth: number, state: Orderbook<Symbol>) => (message: SnapshotMessage) => {
  state.asks = message.asks
    .sort((a, b) => a.price.comparedTo(b.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  state.bids = message.bids
    .sort((a, b) => b.price.comparedTo(a.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  return state;
};

const defaults = {
  depth: 10,
};

// Custom error class for data inconsistencies in the websocket.
class IncosistencyError extends Error {}

export const observe: OrderbookObserver<WatchOptions> = options => {
  const observable$ = new Rx.Observable<Orderbook<Symbol>>(subscriber => {
    const pair = fromStandarPair(options);
    const state: Orderbook<Symbol> = {
      base: options.base,
      quote: options.quote,
      asks: [],
      bids: [],
    };

    // We need to maintain the depth of the subscription because of the
    // way Kraken provides so called "republish" records.
    //
    // @see https://support.kraken.com/hc/en-us/articles/360022326871-Public-WebSockets-API-common-questions
    const opts = {
      ...defaults,
      ...(options.depth && { depth: options.depth }),
    } as WatchOptions;

    const messages$ = subscribe<BookMessage>(pair, {
      ...opts,
      name: 'book',
    }).pipe(share());

    const updates$ = messages$.pipe(
      filter(isUpdate),
      map(([_, message]) => {
        const asks = (message.a || []).map(([price, volume, _, republish]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
          republish: !!republish,
        }));

        const bids = (message.b || []).map(([price, volume, _, republish]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
          republish: !!republish,
        }));

        return { asks, bids };
      }),
      map(update(opts.depth, state)),
    );

    const snapshots$ = messages$.pipe(
      filter(isSnapshot),
      map(([_, message]) => {
        const asks = (message.as || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        const bids = (message.bs || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        return { asks, bids };
      }),
      map(snapshot(opts.depth, state)),
    );

    return Rx.merge(snapshots$, updates$).subscribe(subscriber);
  });

  return observable$.pipe(
    retryWhen(errors =>
      errors.pipe(
        switchMap(error => {
          if (error instanceof IncosistencyError) {
            return Rx.of([]).pipe(
              tap(() => console.error('Data inconsistency. Retrying.')),
              delay(1000),
            );
          }

          return Rx.throwError(error);
        }),
      ),
    ),
  );
};
