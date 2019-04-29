import { socket } from '.';
import BigNumber from 'bignumber.js';
import { map } from 'rxjs/operators';

export interface SubscriptionOptions {
  symbol: string;
  prec?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  freq?: 'F0' | 'F1';
  length?: 25 | 100;
}

export const book = (options: SubscriptionOptions) => {
  const subProps = {
    channel: 'book',
    symbol: options.symbol,
    ...(options.prec && { prec: options.prec }),
    ...(options.freq && { freq: options.freq }),
    ...(options.length && { length: options.length }),
  };

  const subscribe = () => ({
    event: 'subscribe',
    ...subProps,
  });

  return socket(subscribe).pipe(
    map(value => {
      if (Array.isArray(value[0])) {
        return value.map(([price, count, volume]) => ({
          price: new BigNumber(price),
          count: new BigNumber(count),
          volume: new BigNumber(volume),
        }));
      }

      const [price, count, volume] = value;
      return {
        price: new BigNumber(price),
        count: new BigNumber(count),
        volume: new BigNumber(volume),
      };
    }),
  );
};
