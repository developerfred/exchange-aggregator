import * as R from 'ramda';
import {
  SnapshotMessage,
  RemoveOrderMessage,
  OrderMessage,
  AddOrUpdateOrderMessage,
  NormalizedMessageType,
} from '../types';

export const isOrderEvent = R.allPass([R.has('event'), R.has('exchange')]);

export const isAddOrUpdateOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', NormalizedMessageType.ADD),
]) as (payload) => payload is AddOrUpdateOrderMessage;

export const isRemoveOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', NormalizedMessageType.REMOVE),
]) as (payload) => payload is RemoveOrderMessage;

export const isSnapshotEvent = R.allPass([
  R.has('event'),
  R.propEq('event', NormalizedMessageType.SNAPSHOT),
]) as (payload) => payload is SnapshotMessage;

export const debugAddOrUpdateOrderEvent = (
  value: AddOrUpdateOrderMessage,
): any[] => ['Adding / updating order %s.', value.id];

export const debugRemoveOrderEvent = (value: RemoveOrderMessage): any[] => [
  'Removing order %s.',
  value.id,
];

export const debugSnapshotEvent = (value: SnapshotMessage): any[] => [
  'Snapshot with %s orders (bids and asks).',
  value.orders.length,
];

export const debugEvent = R.cond<OrderMessage | SnapshotMessage, any[]>([
  [isAddOrUpdateOrderEvent, debugAddOrUpdateOrderEvent],
  [isRemoveOrderEvent, debugRemoveOrderEvent],
  [isSnapshotEvent, debugSnapshotEvent],
  [R.T, (...value) => [...value]],
]);
