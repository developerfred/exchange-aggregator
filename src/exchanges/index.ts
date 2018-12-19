import * as R from 'ramda';
import {
  StandardizedMessageType,
  AddOrderMessage,
  FillOrderMessage,
  SnapshotMessage,
  RemoveOrderMessage,
  OrderMessage,
  Order,
} from '../types';

const debug = require('debug')('exchange-aggregator');

export const isOrderEvent = R.allPass([
  R.has('type'),
  R.has('id'),
  R.has('exchange'),
]);

export const isAddOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('type', StandardizedMessageType.ADD),
]) as (payload) => payload is AddOrderMessage;

export const isFillOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('type', StandardizedMessageType.FILL),
]) as (payload) => payload is FillOrderMessage;

export const isRemoveOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('type', StandardizedMessageType.REMOVE),
]) as (payload) => payload is RemoveOrderMessage;

export const isSnapshotEvent = R.allPass([
  R.has('type'),
  R.propEq('type', StandardizedMessageType.SNAPSHOT),
]) as (payload) => payload is SnapshotMessage;

export const debugAddOrderEvent = (value: AddOrderMessage): void =>
  debug('Adding order %s.', value.id);

export const debugFillOrderEvent = (value: FillOrderMessage): void =>
  debug('Filling order %s.', value.id);

export const debugRemoveOrderEvent = (value: RemoveOrderMessage): void =>
  debug('Removing order %s.', value.id);

export const debugSnapshotEvent = (value: SnapshotMessage): void =>
  debug('Snapshot with %s orders.', value.snapshot.length);

export const debugEvent = R.cond<OrderMessage | SnapshotMessage, void>([
  [isAddOrderEvent, debugAddOrderEvent],
  [isFillOrderEvent, debugFillOrderEvent],
  [isRemoveOrderEvent, debugRemoveOrderEvent],
  [isSnapshotEvent, debugSnapshotEvent],
]);

export const scanEvent = (
  accumulatur: { [key: string]: Order },
  current: OrderMessage | SnapshotMessage,
): { [key: string]: Order } => {
  if (isSnapshotEvent(current)) {
    return current.snapshot.reduce(
      (carry, item: Order) => {
        const index = `${current.exchange}:${item.id}`;
        return R.set(R.lensProp(index), item, carry);
      },
      {} as any,
    );
  }

  const index = `${current.exchange}:${current.id}`;
  if (isAddOrderEvent(current)) {
    return R.set(R.lensProp(index), current.order, accumulatur);
  }

  if (isRemoveOrderEvent(current)) {
    return R.omit([index], accumulatur);
  }

  if (isFillOrderEvent(current)) {
    // TODO: Add logic for filling orders.
  }

  return accumulatur;
};
