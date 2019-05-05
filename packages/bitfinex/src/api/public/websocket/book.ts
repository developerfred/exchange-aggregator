import * as Rx from 'rxjs';
import * as R from 'ramda';
import { map, scan } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { socket, SubscribeMessage } from './socket';

export interface SubscriptionOptions {
  symbol: string;
  prec?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  freq?: 'F0' | 'F1';
  length?: 25 | 100;
}

export type SubscriptionOptionsWithoutSymbol = Pick<
  SubscriptionOptions,
  Exclude<keyof SubscriptionOptions, 'symbol'>
>;

export const book = <T>(options: SubscriptionOptions) => {
  const subProps = {
    channel: 'book',
    symbol: options.symbol,
    ...(options.prec && { prec: options.prec }),
    ...(options.freq && { freq: options.freq }),
    ...(options.length && { length: options.length }),
  };

  const subscribe = () =>
    ({
      event: 'subscribe',
      ...subProps,
    } as SubscribeMessage);

  return socket<T | T[]>(subscribe);
};

type TradingPairBookEntryRaw = [number, number, number];
export interface TradingPairBookEntry {
  price: BigNumber;
  count: BigNumber;
  amount: BigNumber;
}

export const pair = (
  pair: string,
  options?: SubscriptionOptionsWithoutSymbol,
) => {
  const stream$ = book<TradingPairBookEntryRaw>({
    symbol: `t${pair.split('/').join('')}`,
    ...options,
  });

  return stream$.pipe(
    map(value => {
      if (Array.isArray(value[0])) {
        const snapshot = value as TradingPairBookEntryRaw[];
        return snapshot.map(
          ([price, count, amount]) =>
            ({
              price: new BigNumber(price),
              count: new BigNumber(count),
              amount: new BigNumber(amount),
            } as TradingPairBookEntry),
        );
      }

      const [price, count, amount] = value as TradingPairBookEntryRaw;
      return {
        price: new BigNumber(price),
        count: new BigNumber(count),
        amount: new BigNumber(amount),
      } as TradingPairBookEntry;
    }),
  );
};

type CurrencyBookEntryRaw = [number, number, number, number];
export interface CurrencyBookEntry {
  rate: BigNumber;
  period: BigNumber;
  count: BigNumber;
  amount: BigNumber;
}

export const currency = (
  symbol: string,
  options?: SubscriptionOptionsWithoutSymbol,
) => {
  const stream$ = book<CurrencyBookEntryRaw>({
    symbol: `f${symbol}`,
    ...options,
  });

  return stream$.pipe(
    map(value => {
      if (Array.isArray(value[0])) {
        const snapshot = value as CurrencyBookEntryRaw[];
        return snapshot.map(
          ([rate, period, count, amount]) =>
            ({
              rate: new BigNumber(rate),
              period: new BigNumber(period),
              count: new BigNumber(count),
              amount: new BigNumber(amount),
            } as CurrencyBookEntry),
        );
      }

      const [rate, period, count, amount] = value as CurrencyBookEntryRaw;
      return {
        rate: new BigNumber(rate),
        period: new BigNumber(period),
        count: new BigNumber(count),
        amount: new BigNumber(amount),
      } as CurrencyBookEntry;
    }),
  );
};

type TrackableBookEntry = CurrencyBookEntry | TradingPairBookEntry;
interface KeyedBookEntries<T extends TrackableBookEntry> {
  [key: string]: T;
}

const keyedSnapshot = <T extends TrackableBookEntry>(values: T[]) => {
  return values.reduce((carry, current) => {
    const key = (
      (current as CurrencyBookEntry).rate ||
      (current as TradingPairBookEntry).price
    ).toString();

    return {
      ...carry,
      [key]: current,
    };
  }, {}) as KeyedBookEntries<T>;
};

export const track = <T extends TrackableBookEntry>(
  initial: T[] = [],
): Rx.OperatorFunction<T | T[], T[]> => {
  const start = keyedSnapshot(initial);

  return source =>
    source.pipe(
      scan<T | T[], KeyedBookEntries<T>>((carry, current) => {
        if (Array.isArray(current)) {
          const snapshot = current as T[];
          return keyedSnapshot(snapshot);
        }

        const update = current as T;
        const key = (
          (update as CurrencyBookEntry).rate ||
          (update as TradingPairBookEntry).price
        ).toString();

        if (current.count.isGreaterThan(0)) {
          return {
            ...carry,
            [key]: current,
          };
        }

        if (current.count.isZero()) {
          return R.omit([key], carry);
        }

        return carry;
      }, start),
      map(value => Object.values(value)),
    );
};
