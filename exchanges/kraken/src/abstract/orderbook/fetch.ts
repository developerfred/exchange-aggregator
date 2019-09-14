import BigNumber from 'bignumber.js';
import { OrderbookFetcher, Orderbook, OrderbookEntry, Symbol } from '@melonproject/ea-common';
import { depth, DepthParams } from '../../api/public/depth';

export interface FetchOptions {
  depth?: DepthParams['count'];
  base: Symbol;
  quote: Symbol;
}

export const fetch: OrderbookFetcher<FetchOptions> = async options => {
  const orderbook = Object.values(
    await depth({
      pair: `${options.base}${options.quote}`,
      count: options.depth,
    }),
  ).shift();

  const asks: OrderbookEntry[] = orderbook.asks.map(([price, volume]) => ({
    price: new BigNumber(price),
    volume: new BigNumber(volume),
  }));

  const bids: OrderbookEntry[] = orderbook.bids.map(([price, volume]) => ({
    price: new BigNumber(price),
    volume: new BigNumber(volume),
  }));

  return {
    base: options.base,
    quote: options.quote,
    asks,
    bids,
  } as Orderbook;
};
