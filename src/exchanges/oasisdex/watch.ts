import * as Rx from 'rxjs';
import { OasisDex } from './types';
import { fetch } from './fetch';
import {
  SnapshotMessage,
  Order,
  NormalizedMessageType,
  Exchange,
} from '../../types';
import { retryWhen, delay, map, tap, exhaustMap } from 'rxjs/operators';
import { cleanEvents } from '../../utils/cleanEvents';
import * as debug from '../../debug';

const createSnapshot = (
  options: OasisDex.WatchOptions,
  orders: Order[],
): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.OASIS_DEX,
  network: options.network,
  base: options.pair.base,
  quote: options.pair.quote,
  orders,
});

export const watch = (options: OasisDex.WatchOptions) => {
  const orders$ = Rx.timer(0, 5000).pipe(
    retryWhen(error => error.pipe(delay(10000))),
    exhaustMap(() => fetch(options)),
  );

  return orders$.pipe(
    map(orders => createSnapshot(options, orders)),
    tap(event => debug.log('Source event: %e', event)),
    cleanEvents(),
    tap(event => debug.log('Output event: %e', event)),
  );
};
