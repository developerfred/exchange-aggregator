import axios from 'axios';
import { Order, OrderType, Network } from '../../types';
import { Kraken } from './types';
import { KrakenOrder, normalizeOrder } from './common';
import { wethToEth } from '../../utils/wethToEth';

interface KrakenOrderbook {
  asks: KrakenOrder[];
  bids: KrakenOrder[];
}

interface KrakenResponse {
  error: string[];
  result?: {
    [key: string]: KrakenOrderbook;
  };
}

const getHttpUrl = (options: Kraken.FetchOptions) => {
  const base = wethToEth(options.pair.base.symbol);
  const quote = wethToEth(options.pair.quote.symbol);

  switch (options.network) {
    case Network.MAINNET:
      return `https://api.kraken.com/0/public/Depth?pair=${base}${quote}`;
    default:
      throw new Error('Kraken only supports the MAINNET network.');
  }
};

export const fetch = async (options: Kraken.FetchOptions): Promise<Order[]> => {
  const url = getHttpUrl(options);
  const response = await axios
    .get(url)
    .then(value => value.data as KrakenResponse);

  if (response.error && response.error.length) {
    throw new Error(response.error.join(''));
  }

  const result = response.result;
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;
  const key = `X${base}X${quote}`;
  const orderbook = (result && result[key]) || {
    asks: [],
    bids: [],
  };

  const asks = orderbook.asks.map(order =>
    normalizeOrder(options, OrderType.ASK, order),
  );

  const bids = orderbook.bids.map(order =>
    normalizeOrder(options, OrderType.BID, order),
  );

  return [].concat(asks, bids);
};
