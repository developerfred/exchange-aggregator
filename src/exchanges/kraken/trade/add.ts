import { privateRequest } from '../common';
import { OrderType, OrderRequest } from '../../../types';
import { Kraken } from '../types';

interface TradeData {
  nonce: string;
  pair: string;
  type: 'market' | 'limit';
  ordertype: 'buy' | 'sell';
  volume: string;
  price?: string;
}

export const add = async (trade: OrderRequest, auth: Kraken.Authentication) => {
  const base = trade.base;
  const quote = trade.quote;
  const params = {
    pair: `${base}${quote}`,
    type: trade.side.toLowerCase(),
    ordertype: trade.type.toLowerCase(),
    volume: trade.volume,
    ...(trade.type === OrderType.LIMIT && {
      price: trade.price,
    }),
  } as TradeData;

  const response = (await privateRequest('AddOrder', params, auth)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
