import * as Rx from 'rxjs';
import { map } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { socket, SubscribeMessage } from './socket';

export interface SubscriptionOptions {
  symbol: string;
  prec?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  freq?: 'F0' | 'F1';
  length?: 25 | 100;
}

export type SubscriptionOptionsWithoutSymbol = Pick<SubscriptionOptions, Exclude<keyof SubscriptionOptions, 'symbol'>>;

const watchBook = <T>(options: SubscriptionOptions) => {
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

export const watchAssetPair = (
  pair: string,
  options?: SubscriptionOptionsWithoutSymbol,
): Rx.Observable<TradingPairBookEntry | TradingPairBookEntry[]> => {
  const stream$ = watchBook<TradingPairBookEntryRaw>({
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

export const watchCurrency = (
  symbol: string,
  options?: SubscriptionOptionsWithoutSymbol,
): Rx.Observable<CurrencyBookEntry | CurrencyBookEntry[]> => {
  const stream$ = watchBook<CurrencyBookEntryRaw>({
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
