import * as R from 'ramda';
import {
  StandardizedMessageType,
  AddOrderMessage,
  FillOrderMessage,
  SnapshotMessage,
  RemoveOrderMessage,
  OrderMessage,
} from '../types';

const debug = require('debug')('exchange-aggregator');

export const isOrderEvent = R.allPass([R.has('event'), R.has('exchange')]);

export const isAddOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', StandardizedMessageType.ADD),
]) as (payload) => payload is AddOrderMessage;

export const isFillOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', StandardizedMessageType.FILL),
]) as (payload) => payload is FillOrderMessage;

export const isRemoveOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', StandardizedMessageType.REMOVE),
]) as (payload) => payload is RemoveOrderMessage;

export const isSnapshotEvent = R.allPass([
  R.has('event'),
  R.propEq('event', StandardizedMessageType.SNAPSHOT),
]) as (payload) => payload is SnapshotMessage;

export const debugAddOrderEvent = (value: AddOrderMessage): void =>
  debug('%s: Adding order %s.', value.exchange, value.id);

export const debugFillOrderEvent = (value: FillOrderMessage): void =>
  debug('%s: Filling order %s.', value.exchange, value.id);

export const debugRemoveOrderEvent = (value: RemoveOrderMessage): void =>
  debug('%s: Removing order %s.', value.exchange, value.id);

export const debugSnapshotEvent = (value: SnapshotMessage): void =>
  debug(
    '%s: Snapshot with %s asks and %s bids.',
    value.exchange,
    value.asks.length,
    value.bids.length,
  );

export const debugEvent = R.cond<OrderMessage | SnapshotMessage, void>([
  [isAddOrderEvent, debugAddOrderEvent],
  [isFillOrderEvent, debugFillOrderEvent],
  [isRemoveOrderEvent, debugRemoveOrderEvent],
  [isSnapshotEvent, debugSnapshotEvent],
]);
