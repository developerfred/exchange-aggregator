import axios from 'axios';
import * as R from 'ramda';
import { Kyber } from './types';
import { Network, OrderType, Exchange, Order } from '../../types';
import { createPrice, createQuantity } from '@melonproject/token-math';

export interface Currency {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
  id: string;
}

interface KyberCurrenciesResponse {
  error: any;
  data: Currency[];
}

interface Rate {
  src_id: string;
  dst_id: string;
  src_qty: number[];
  dst_qty: [];
}

interface KyberRateResponse {
  error: any;
  data: Rate[];
}

const getCurrenciesHttpUrl = (options: Kyber.WatchOptions) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'https://api.kyber.network/currencies';
    default:
      throw new Error('Kyber only supports the MAINNET network.');
  }
};

const getRateHttpUrl = (
  options: Kyber.WatchOptions,
  type: 'buy' | 'sell',
  currency: string,
  interval: number[],
) => {
  if (options.network !== Network.MAINNET) {
    throw new Error('Kyber only supports the MAINNET network.');
  }

  const prefix = `https://api.kyber.network/${type}_rate`;
  const splits = R.splitEvery(5, interval);
  const suffix = splits
    .map(split => {
      const quantities = split
        .map(qty => {
          return `qty=${qty}`;
        })
        .join('&');

      return `id=${currency}&${quantities}`;
    })
    .join('&');

  return `${prefix}?${suffix}`;
};

const formatResponse = (
  options: Kyber.WatchOptions,
  type: OrderType,
  response: KyberRateResponse,
) => {
  if (response.error) {
    throw new Error(`Error trying to fetch Kyber ${type} rates.`);
  }

  const volumeKey = type === OrderType.ASK ? 'src_qty' : 'dst_qty';
  const priceKey = type === OrderType.ASK ? 'dst_qty' : 'src_qty';
  const groups = response.data.map(current => {
    return Object.keys(current[volumeKey] as any).map(
      (index): Order => {
        const volume = current[volumeKey][index];
        const price = current[priceKey][index];
        const oid = Buffer.from(`${Exchange.KYBER_NETWORK}:${volume}`).toString(
          'base64',
        );

        const trade = createPrice(
          createQuantity(options.pair.base, volume),
          createQuantity(options.pair.quote, price),
        );

        return {
          id: oid,
          exchange: Exchange.KYBER_NETWORK,
          type,
          trade,
        };
      },
    );
  });

  return [].concat(...groups) as Order[];
};

export const fetchCurrencies = async (options: Kyber.FetchOptions) => {
  const url = getCurrenciesHttpUrl(options);
  const response = await axios
    .get(url)
    .then(result => result.data as KyberCurrenciesResponse);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data;
};

export const fetchRates = async (
  options: Kyber.FetchOptions,
  currencies: Currency[],
) => {
  const base = options.pair.base.symbol;
  const currency = currencies.find(R.propEq('symbol', base));
  if (!currency) {
    throw new Error(`The ${base} token is not supported.`);
  }

  const quantities = options.quantities || [1, 10, 100, 1000];
  const buyUrl = getRateHttpUrl(options, 'buy', currency.id, quantities);
  const sellUrl = getRateHttpUrl(options, 'sell', currency.id, quantities);

  const sellRequest = axios.get(sellUrl).then(result => result.data) as Promise<
    KyberRateResponse
  >;

  const buyRequest = axios.get(buyUrl).then(result => result.data) as Promise<
    KyberRateResponse
  >;

  const [buyResponse, sellResponse] = await Promise.all([
    buyRequest,
    sellRequest,
  ]);

  return [].concat(
    formatResponse(options, OrderType.BID, buyResponse),
    formatResponse(options, OrderType.ASK, sellResponse),
  );
};

export const fetch = async (options: Kyber.FetchOptions) => {
  const currencies = await fetchCurrencies(options);
  return fetchRates(options, currencies);
};
