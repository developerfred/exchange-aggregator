import * as R from 'ramda';
import * as Rx from 'rxjs';
import { toWei } from 'web3-utils';
import {
  subscribe,
  SubscriptionParams,
  BookSnapshotMessage,
  BookUpdateMessage,
  BookMessage,
} from '../../api/websocket';
import { filter, map, share } from 'rxjs/operators';

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
): [string, string, [string, string][]] => {
  const asks = (message.as || []).map(
    ([price, volume]) =>
      [toWei(price), toWei(`-${volume}`)] as [string, string],
  );

  const bids = (message.bs || []).map(
    ([price, volume]) => [toWei(price), toWei(volume)] as [string, string],
  );

  const items = [...asks, ...bids] as [string, string][];
  return ['snapshot', pair, items];
};

const isUpdate = R.compose(
  R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (payload: [string, BookMessage]) => payload is [string, BookUpdateMessage];

const normalizeUpdate = (
  pair: string,
  message: BookUpdateMessage,
): [string, string, [string, string][]] => {
  const asks = (message.a || []).map(
    ([price, volume]) =>
      [toWei(price), toWei(`-${volume}`)] as [string, string],
  );

  const bids = (message.b || []).map(
    ([price, volume]) => [toWei(price), toWei(volume)] as [string, string],
  );

  const items = [...asks, ...bids] as [string, string][];
  return ['update', pair, items];
};

export const watch = (pairs: string[], options?: WatchOptions) => {
  const messages$ = subscribe<BookMessage>(pairs, {
    ...options,
    name: 'book',
  }).pipe(share());

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
