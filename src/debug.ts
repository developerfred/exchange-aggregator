import * as R from 'ramda';
import debug from 'debug';
import {
  SnapshotMessage,
  RemoveOrderMessage,
  SetOrderMessage,
  AnyOrderMessage,
} from './types';
import { isSetOrderEvent, isRemoveOrderEvent, isSnapshotEvent } from './events';

const debugSetOrderEvent = (value: SetOrderMessage): string =>
  `Setting order ${value.id}.`;

const debugRemoveOrderEvent = (value: RemoveOrderMessage): string =>
  `Removing order ${value.id}.`;

const debugSnapshotEvent = (value: SnapshotMessage): string =>
  `Snapshot with ${value.orders.length} orders (bids and asks).`;

const formatEvent = R.cond<AnyOrderMessage, string>([
  [isSetOrderEvent, debugSetOrderEvent],
  [isRemoveOrderEvent, debugRemoveOrderEvent],
  [isSnapshotEvent, debugSnapshotEvent],
  [R.T, R.always('Invalid event.')],
]);

debug.formatters.e = event => {
  return formatEvent(event);
};

debug.formatters.s = value => {
  return value.toString();
};

export const log = debug('ea:log');
log.log = console.log.bind(console);

export const error = debug('ea:error');
error.log = console.error.bind(console);
