import * as Rx from 'rxjs';
import {
  map,
  delay,
  retryWhen,
  catchError,
  distinctUntilChanged,
  tap,
  exhaustMap,
} from 'rxjs/operators';
import {
  Order,
  NormalizedMessageType,
  Exchange,
  SnapshotMessage,
} from '../../types';
import * as debug from '../../debug';
import { fetch } from './fetch';
import { Kraken } from './types';
import { cleanEvents } from '../../utils/cleanEvents';

const createSnapshot = (
  options: Kraken.WatchOptions,
  orders: Order[],
): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.KRAKEN,
  network: options.network,
  base: options.pair.base,
  quote: options.pair.quote,
  orders,
});

export const watch = (options: Kraken.Options) => {
  const interval = options.interval || 5000;

  const polling$ = Rx.timer(0, interval).pipe(
    exhaustMap(() => fetch(options)),
    catchError(error => {
      debug.error('Error while trying to fetch: %s.', error);
      return Rx.throwError(error);
    }),
    retryWhen(error => {
      debug.log('Retrying in %s miliseconds.', interval);
      return error.pipe(delay(interval));
    }),
    distinctUntilChanged(),
  );

  return polling$.pipe(
    map(orders => createSnapshot(options, orders)),
    tap(event => debug.log('Source event: %e', event)),
    cleanEvents(),
    tap(event => debug.log('Output event: %e', event)),
  );
};
