import { OrderbookEntry, Token, OrderbookFetcher } from '@melonproject/ea-common';
import { getUniswapRate } from '../../api/calls/getUniswapRate';
import { Environment } from '../../types';
import BigNumber from 'bignumber.js';

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
  const quantities = options.quantities || defaults.quantities;

  const asksPromises = Promise.all(
    quantities.map(async qty => {
      const result = await getUniswapRate(options.environment, {
        takerAsset: options.base,
        makerAsset: options.quote,
        takerQuantity: qty.toString(),
        targetExchange: options.environment.addresses.UniswapFactory,
      });

      return {
        price: result,
        volume: qty,
      } as OrderbookEntry;
    }),
  );

  const bidsPromises = Promise.all(
    quantities.map(async qty => {
      const result = await getUniswapRate(options.environment, {
        takerAsset: options.quote,
        makerAsset: options.base,
        takerQuantity: qty.toString(),
        targetExchange: options.environment.addresses.UniswapFactory,
      });

      return {
        price: new BigNumber(1).dividedBy(result),
        volume: qty,
      } as OrderbookEntry;
    }),
  );

  const [asks, bids] = await Promise.all([asksPromises, bidsPromises]);

  return {
    base: options.base,
    quote: options.quote,
    asks: asks.filter(item => item.price.isFinite() && !item.price.isZero()),
    bids: bids.filter(item => item.price.isFinite() && !item.price.isZero()),
  };
};
