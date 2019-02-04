import { OrderType, Exchange, Order } from '../../types';
import { createQuantity, createPrice } from '@melonproject/token-math';
import { Ethfinex } from './types';

export type EthfinexOrder = [number, number, number];

export const wethToEth = (token: string) => token.replace(/^WETH$/, 'ETH');

export const orderId = (order: EthfinexOrder) => {
  const [id] = order;
  const key = `${Exchange.ETHFINEX}:${id}`;
  return Buffer.from(key).toString('base64');
};

export const normalizeOrder = (
  options: Ethfinex.Options,
  order: EthfinexOrder,
  id: string,
) => {
  const [, price, amount] = order;
  const volume = Math.abs(amount);
  const trade = createPrice(
    createQuantity(options.pair.base, volume),
    createQuantity(options.pair.quote, price * volume),
  );

  return {
    id,
    type: amount > 0 ? OrderType.BID : OrderType.ASK,
    exchange: Exchange.ETHFINEX,
    trade,
  } as Order;
};
