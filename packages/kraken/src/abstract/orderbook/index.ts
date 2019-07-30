import * as R from 'ramda';
import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import {
  subscribe,
  SubscriptionParams,
  BookSnapshotMessage,
  BookUpdateMessage,
  BookMessage,
} from '../../api/websocket';
import { OrderbookObserver, AssetPair } from '@melonproject/ea-common';
import { filter, map, share } from 'rxjs/operators';
import { fromStandarPair } from '../mapping';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
}

interface KeyedAssetPairs {
  [key: string]: AssetPair;
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

export const observeOrderbook: OrderbookObserver<WatchOptions> = (pairs, options) => {
  const pairsKeyed = pairs.reduce(
    (carry, current) => ({
      ...carry,
      [fromStandarPair(current)]: current,
    }),
    {},
  ) as KeyedAssetPairs;

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
        depth: opts.depth!,
        snapshot: false,
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
        depth: opts.depth!,
        snapshot: true,
      };
    }),
  );

  return Rx.merge(snapshots$, updates$);
};
