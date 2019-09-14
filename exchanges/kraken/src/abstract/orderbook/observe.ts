import * as R from 'ramda';
import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import { OrderbookObserver, SymbolAssetPair, Orderbook, Symbol } from '@melonproject/ea-common';
import { update, snapshot } from '@melonproject/ea-common/lib/track';
import { subscribe } from '../../api/websocket';
import { filter, map, share } from 'rxjs/operators';
import { fromStandarPair } from '../mapping';
import { BookUpdateMessage, BookMessage, SubscriptionParams, BookSnapshotMessage } from '../../api/types';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
  pairs: SymbolAssetPair[];
}

interface KeyedAssetPairs {
  [key: string]: SymbolAssetPair;
}

interface KeyedState {
  [key: string]: Orderbook<Symbol>;
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
    const pairsKeyed = options.pairs.reduce(
      (carry, current) => ({
        ...carry,
        [fromStandarPair(current)]: current,
      }),
      {},
    ) as KeyedAssetPairs;

    const stateKeyed = Object.values(pairsKeyed).reduce(
      (carry, current) => ({
        ...carry,
        [`${current.base}/${current.quote}`]: {
          base: current.base,
          quote: current.quote,
          asks: [],
          bids: [],
        },
      }),
      {},
    ) as KeyedState;

    // We need to maintain the depth of the subscription because of the
    // way Kraken provides so called "republish" records.
    //
    // @see https://support.kraken.com/hc/en-us/articles/360022326871-Public-WebSockets-API-common-questions
    const opts = {
      ...defaults,
      ...options,
    } as WatchOptions;

    const messages$ = subscribe<BookMessage>(Object.keys(pairsKeyed), {
      ...opts,
      name: 'book',
    }).pipe(share());

    const updates$ = messages$.pipe(
      filter(isUpdate),
      map(([key, message]) => {
        const pair = pairsKeyed[key];
        const asks = (message.a || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        const bids = (message.b || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        return {
          ...pair,
          asks,
          bids,
        };
      }),
    );

    const snapshots$ = messages$.pipe(
      filter(isSnapshot),
      map(([key, message]) => {
        const pair = pairsKeyed[key];
        const asks = (message.as || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        const bids = (message.bs || []).map(([price, volume]) => ({
          price: new BigNumber(price),
          volume: new BigNumber(volume),
        }));

        return {
          ...pair,
          asks,
          bids,
        };
      }),
    );

    const state = (message: Orderbook<Symbol>) => stateKeyed[`${message.base}/${message.quote}`];
    const updates = updates$.subscribe(update(subscriber, opts.depth, state));
    const snapshots = snapshots$.subscribe(snapshot(subscriber, opts.depth, state));

    return () => {
      updates.unsubscribe();
      snapshots.unsubscribe();
    };
  });
