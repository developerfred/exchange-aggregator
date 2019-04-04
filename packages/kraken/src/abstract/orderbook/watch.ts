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
import { filter, map, share, switchMap } from 'rxjs/operators';
import { toStandardPair, fromStandarPair } from '../mapping';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
}

const isSnapshot = R.compose(
  R.cond([[R.has('as'), R.T], [R.has('bs'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (
  payload: [string, BookMessage],
) => payload is [string, BookSnapshotMessage];

const normalizeSnapshot = (
  pair: string,
  message: BookSnapshotMessage,
): [string, string, [BigNumber, BigNumber][]] => {
  const asks = (message.as || []).map(([price, volume]) => [
    new BigNumber(price),
    new BigNumber(volume).negated(),
  ]);

  const bids = (message.bs || []).map(([price, volume]) => [
    new BigNumber(price),
    new BigNumber(volume),
  ]);

  const items = [...asks, ...bids] as [BigNumber, BigNumber][];
  return ['snapshot', toStandardPair(pair), items];
};

const isUpdate = R.compose(
  R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (payload: [string, BookMessage]) => payload is [string, BookUpdateMessage];

const normalizeUpdate = (
  pair: string,
  message: BookUpdateMessage,
): [string, string, [BigNumber, BigNumber][]] => {
  const asks = (message.a || []).map(([price, volume]) => [
    new BigNumber(price),
    new BigNumber(volume).negated(),
  ]);

  const bids = (message.b || []).map(([price, volume]) => [
    new BigNumber(price),
    new BigNumber(volume),
  ]);

  const items = [...asks, ...bids] as [BigNumber, BigNumber][];
  return ['update', toStandardPair(pair), items];
};

export const watch = (pairs: string[], options?: WatchOptions) => {
  const standardized = pairs.map(pair => fromStandarPair(pair));

  // Periodically restart the connection to fetch a fresh
  // snapshot (e.g. to reset the depth).
  const messages$ = Rx.timer(0, 60000).pipe(
    switchMap(() =>
      Rx.timer(250).pipe(
        switchMap(() => {
          return subscribe<BookMessage>(standardized, {
            ...options,
            name: 'book',
          });
        }),
      ),
    ),
    share(),
  );

  const snapshots$ = messages$.pipe(
    filter(isSnapshot),
    map(message => normalizeSnapshot(message[0], message[1])),
  );

  const updates$ = messages$.pipe(
    filter(isUpdate),
    map(message => normalizeUpdate(message[0], message[1])),
  );

  return Rx.merge(snapshots$, updates$);
};
