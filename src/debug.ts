import * as R from 'ramda';
import {
  SnapshotMessage,
  RemoveOrderMessage,
  OrderMessage,
  SetOrderMessage,
} from './types';
import { isSetOrderEvent, isRemoveOrderEvent, isSnapshotEvent } from './events';

export const debugSetOrderEvent = (value: SetOrderMessage): any[] => [
  'Setting order %s.',
  value.id,
];

export const debugRemoveOrderEvent = (value: RemoveOrderMessage): any[] => [
  'Removing order %s.',
  value.id,
];

export const debugSnapshotEvent = (value: SnapshotMessage): any[] => [
  'Snapshot with %s orders (bids and asks).',
  value.orders.length,
];

export const eventToMessageFragments = R.cond<
  OrderMessage | SnapshotMessage,
  any[]
>([
  [isSetOrderEvent, debugSetOrderEvent],
  [isRemoveOrderEvent, debugRemoveOrderEvent],
  [isSnapshotEvent, debugSnapshotEvent],
  [R.T, (...value) => [...value]],
]);

export type DebugFn = (...args: any[]) => void;
export const debugEvent = R.curryN(2, (debug: DebugFn, value: any) => {
  const fragments = eventToMessageFragments(value);
  debug(...fragments);
});
