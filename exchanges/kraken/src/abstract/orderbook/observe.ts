import * as R from 'ramda';
import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import { OrderbookObserver, Orderbook, Symbol } from '@melonproject/ea-common';
import { update, snapshot } from '@melonproject/ea-common/lib/track';
import { subscribe } from '../../api/websocket';
import { filter, map, share } from 'rxjs/operators';
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

const defaults = {
  depth: 10,
};

export const observe: OrderbookObserver<WatchOptions> = options =>
  new Rx.Observable(subscriber => {
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
        const asks = (message.a || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        const bids = (message.b || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        return { asks, bids };
      }),
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
    );

    const updates = updates$.subscribe(update(subscriber, opts.depth, () => state));
    const snapshots = snapshots$.subscribe(snapshot(subscriber, opts.depth, () => state));

    return () => {
      updates.unsubscribe();
      snapshots.unsubscribe();
    };
  });
