import * as R from 'ramda';
import {
  NormalizedMessageType,
  SetOrderMessage,
  RemoveOrderMessage,
  SnapshotMessage,
} from './types';

export const isOrderEvent = R.allPass([R.has('event'), R.has('exchange')]);

export const isSetOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', NormalizedMessageType.SET),
]) as (payload) => payload is SetOrderMessage;

export const isRemoveOrderEvent = R.allPass([
  isOrderEvent,
  R.propEq('event', NormalizedMessageType.REMOVE),
]) as (payload) => payload is RemoveOrderMessage;

export const isSnapshotEvent = R.allPass([
  R.has('event'),
  R.propEq('event', NormalizedMessageType.SNAPSHOT),
]) as (payload) => payload is SnapshotMessage;
