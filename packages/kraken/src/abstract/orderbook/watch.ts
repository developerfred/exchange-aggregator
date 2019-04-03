import * as R from 'ramda';
import * as Rx from 'rxjs';
import BN from 'bn.js';
import {
  subscribe,
  SubscriptionParams,
  BookSnapshotMessage,
  BookUpdateMessage,
  BookMessage,
} from '../../api/websocket';
import { filter, map } from 'rxjs/operators';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
}

const isSnapshot = R.cond([
  [R.has('as'), R.T],
  [R.has('bs'), R.T],
  [R.T, R.F],
]) as (payload: BookMessage) => payload is BookSnapshotMessage;

const normalizeSnapshot = (message: BookSnapshotMessage) => {
  const asks = (message.as || []).map(([price, volume]) => [
    new BN(price),
    new BN(volume).neg(),
  ]);

  const bids = (message.bs || []).map(([price, volume]) => [
    new BN(price),
    new BN(volume),
  ]);

  return ['snapshot', [...asks, ...bids]];
};

const isUpdate = R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]) as (
  payload: BookMessage,
) => payload is BookUpdateMessage;

const normalizeUpdate = (message: BookUpdateMessage) => {
  const asks = (message.a || []).map(([price, volume]) => [
    new BN(price),
    new BN(volume).neg(),
  ]);

  const bids = (message.b || []).map(([price, volume]) => [
    new BN(price),
    new BN(volume),
  ]);

  return ['update', [...asks, ...bids]];
};

export const watch = (pairs: string[], options?: WatchOptions) => {
  const messages$ = subscribe<BookMessage>(pairs, {
    ...options,
    name: 'book',
  });

  const snapshots$ = messages$.pipe(
    filter(isSnapshot),
    map(message => normalizeSnapshot(message)),
  );

  const updates$ = messages$.pipe(
    filter(isUpdate),
    map(message => normalizeUpdate(message)),
  );

  return Rx.merge(snapshots$, updates$);
};
