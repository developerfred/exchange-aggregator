import * as Rx from 'rxjs';
import {
  map,
  switchMap,
  delay,
  retryWhen,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import {
  NormalizedMessageType,
  Exchange,
  SnapshotMessage,
  Order,
} from '../../types';
import * as debug from '../../debug';
import { Kyber } from './types';
import { fetchCurrencies, Currency, fetchRates } from './fetch';

const createSnapshot = (orders: Order[]): SnapshotMessage => ({
  event: NormalizedMessageType.SNAPSHOT,
  exchange: Exchange.KYBER_NETWORK,
  orders,
});

const pollRate = (options: Kyber.WatchOptions, currencies: Currency[]) => {
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;

  return Rx.interval(5000).pipe(
    tap(() => {
      debug.log(`Loading snapshot for market %s-%s.`, base, quote);
    }),
    switchMap(() => fetchRates(options, currencies)),
    retryWhen(error => error.pipe(delay(10000))),
    distinctUntilChanged(),
  );
};

export const watch = (options: Kyber.WatchOptions) => {
  const rates$ = Rx.from(fetchCurrencies(options)).pipe(
    retryWhen(error => error.pipe(delay(10000))),
    switchMap(currencies => pollRate(options, currencies)),
  );

  return rates$.pipe(
    map(createSnapshot),
    tap(event => debug.log('%e', event)),
  );
};
