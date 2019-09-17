import BigNumber from 'bignumber.js';
import { OrderbookFetcher, Symbol } from '@melonproject/ea-common';
import { orderbook } from '../../api';

export interface FetchOptions {
  base: Symbol;
  quote: Symbol;
}

export const fetch: OrderbookFetcher<FetchOptions> = async options => {
  const ob = await orderbook({
    instrument_code: `${options.base}_${options.quote}`,
    level: 3,
  });

  const asks = ob.asks
    .map(value => ({
      price: new BigNumber(value.price),
      volume: new BigNumber(value.amount),
    }))
    .sort((a, b) => b.price.comparedTo(a.price));

  const bids = ob.bids
    .map(value => ({
      price: new BigNumber(value.price),
      volume: new BigNumber(value.amount),
    }))
    .sort((a, b) => b.price.comparedTo(a.price));

  return {
    base: options.base,
    quote: options.quote,
    asks,
    bids,
  };
};
