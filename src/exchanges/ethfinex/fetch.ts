import axios from 'axios';
import { Network, Order } from '../../types';
import { EthfinexOrder, normalizeOrder, wethToEth } from './common';
import { Ethfinex } from './types';

const getHttpUrl = (options: Ethfinex.FetchOptions) => {
  const base = wethToEth(options.pair.base.symbol);
  const quote = wethToEth(options.pair.quote.symbol);

  switch (options.network) {
    case Network.MAINNET:
      return `https://api.ethfinex.com/v2/book/t${base}${quote}/R0`;
    default:
      throw new Error('Ethfinex only supports the MAINNET network.');
  }
};

export const fetch = async (
  options: Ethfinex.FetchOptions,
): Promise<Order[]> => {
  const { data } = await axios.get(getHttpUrl(options));
  return data.map((order: EthfinexOrder) => normalizeOrder(options, order));
};
