import axios from 'axios';
import { Network, OrderbookOrder } from '../../types';
import { EthfinexOrder, normalizeOrder, orderId } from './common';
import { Ethfinex } from './types';
import { wethToEth } from '../../utils/wethToEth';

const getHttpUrl = (options: Ethfinex.FetchOptions) => {
  const base = wethToEth(options.base);
  const quote = wethToEth(options.quote);

  switch (options.network) {
    case Network.MAINNET:
      return `https://api.ethfinex.com/v2/book/t${base}${quote}/R0`;
    case Network.KOVAN:
      return `https://kovan.api.ethfinex.com/v2/book/t${base}${quote}/R0`;
    default:
      throw new Error('Invalid network.');
  }
};

export const fetch = async (
  options: Ethfinex.FetchOptions,
): Promise<OrderbookOrder[]> => {
  const { data } = await axios.get(getHttpUrl(options));
  return data.map((order: EthfinexOrder) => {
    const id = orderId(order);
    return normalizeOrder(options, order, id);
  });
};
