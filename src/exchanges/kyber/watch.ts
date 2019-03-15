import * as Rx from 'rxjs';
import { map, delay, retryWhen, tap, exhaustMap } from 'rxjs/operators';
import {
  NormalizedMessageType,
  Exchange,
  SnapshotMessage,
  OrderbookOrder,
} from '../../types';
import * as debug from '../../debug';
import { Kyber } from './types';
import { fetch } from './fetch';
import { cleanEvents } from '../../utils/cleanEvents';

const createSnapshot = (
  options: Kyber.WatchOptions,
  orders: OrderbookOrder[],
): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.KYBER_NETWORK,
  network: options.network,
  base: options.base,
  quote: options.quote,
  orders,
});

export const watch = (options: Kyber.WatchOptions) => {
  const interval = options.interval || 10000;
  const orders$ = Rx.timer(0, interval).pipe(
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
