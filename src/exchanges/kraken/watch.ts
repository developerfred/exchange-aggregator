import * as Rx from 'rxjs';
import {
  map,
  switchMap,
  delay,
  retryWhen,
  catchError,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import {
  Order,
  NormalizedMessageType,
  Exchange,
  SnapshotMessage,
} from '../../types';
import { debugEvent } from '../../debug';
import { fetch } from './fetch';
import { Kraken } from './types';

const debug = require('debug')('exchange-aggregator:kraken');

const createSnapshot = (orders: Order[]): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.KRAKEN,
  orders,
});

export const watch = (options: Kraken.Options) => {
  const interval = options.interval || 5000;

  const polling$ = Rx.interval(interval).pipe(
    switchMap(() => fetch(options)),
    catchError(error => {
      debug('Error while trying to fetch: %s.', error);
      return Rx.throwError(error);
    }),
    retryWhen(error => {
      debug('Caught error. Retrying in %s miliseconds.', interval);
      return error.pipe(delay(interval));
    }),
    distinctUntilChanged(),
  );

  return polling$.pipe(
    map(createSnapshot),
    tap(debugEvent(debug)),
  );
};
