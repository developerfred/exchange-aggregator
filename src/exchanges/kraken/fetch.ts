import axios from 'axios';
import { Order, OrderType, Network, Exchange } from '../../types';
import { createPrice, createQuantity } from '@melonproject/token-math';
import { Kraken } from './types';

interface KrakenOrderbook {
  asks: [number, number, number][];
  bids: [number, number, number][];
}

interface KrakenResponse {
  error: string[];
  result?: {
    [key: string]: KrakenOrderbook;
  };
}

const normalizeOrder = (
  options: Kraken.Options,
  type: OrderType,
  [price, volume, timestamp]: [number, number, number],
): Order => {
  const oid = Buffer.from(
    `${Exchange.KRAKEN}:${price}:${volume}:${timestamp}`,
  ).toString('base64');

  const trade = createPrice(
    createQuantity(options.pair.base, volume),
    createQuantity(options.pair.quote, price * volume),
  );

  return {
    id: oid,
    exchange: Exchange.KRAKEN,
    type,
    trade,
  };
};

const getHttpUrl = (options: Kraken.FetchOptions) => {
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;

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
