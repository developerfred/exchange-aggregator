import { OrderType, Exchange, Order } from '../../types';
import { createQuantity, createPrice } from '@melonproject/token-math';
import { Ethfinex } from './types';

export type EthfinexOrder = [number, number, number];

export const wethToEth = (token: string) => token.replace(/^WETH$/, 'ETH');

export const normalizeOrder = (
  options: Ethfinex.Options,
  order: EthfinexOrder,
) => {
  const [id, price, amount] = order;
  const key = `${Exchange.ETHFINEX}:${id}`;
  const volume = Math.abs(amount);

  return {
    id: Buffer.from(key).toString('base64'),
    type: amount > 0 ? OrderType.BID : OrderType.ASK,
    exchange: Exchange.ETHFINEX,
    trade: createPrice(
      createQuantity(options.pair.base, volume),
      createQuantity(options.pair.quote, price * volume),
    ),
  } as Order;
};
