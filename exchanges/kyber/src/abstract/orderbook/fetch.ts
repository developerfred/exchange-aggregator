import BigNumber from 'bignumber.js';
import { OrderbookEntry, Token, OrderbookFetcher } from '@melonproject/ea-common';
import { getExpectedRate } from '../../methods/KyberNetworkProxy/getExpectedRate';
import { Environment } from '../..';

export interface FetchOptions {
  quantities?: BigNumber[];
  environment: Environment;
  base: Token;
  quote: Token;
}

const defaults = {
  quantities: [1, 10, 25, 50, 100].map(qty => new BigNumber(qty)),
};

export const fetch: OrderbookFetcher<FetchOptions, Token> = async options => {
  const quantities: BigNumber[] = options.quantities || defaults.quantities;

  const asksPromise = Promise.all(
    quantities.map(async qty => {
      const result = await getExpectedRate(options.environment, options.base.address, options.quote.address, qty);

      return {
        price: result.expectedRate,
        volume: qty,
      } as OrderbookEntry;
    }),
  );

  const bidsPromises = Promise.all(
    quantities.map(async qty => {
      const result = await getExpectedRate(options.environment, options.base.address, options.quote.address, qty);

      return {
        price: new BigNumber(1).dividedBy(result.expectedRate),
        volume: qty,
      } as OrderbookEntry;
    }),
  );

  const [asks, bids] = await Promise.all([asksPromise, bidsPromises]);

  return {
    base: options.base,
    quote: options.quote,
    asks: asks.filter(item => item.price.isFinite() && !item.price.isZero()),
    bids: bids.filter(item => item.price.isFinite() && !item.price.isZero()),
  };
};
