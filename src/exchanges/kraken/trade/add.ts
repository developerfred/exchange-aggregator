import axios from 'axios';
import qs from 'qs';
import { getHttpPrefix, generateSignature } from '../common';
import { Trade, OrderType } from '../../../types';
import { Kraken } from '../types';

interface TradeData {
  nonce: string;
  pair: string;
  type: 'market' | 'limit';
  ordertype: 'buy' | 'sell';
  volume: string;
  price?: string;
}

export const add = async (trade: Trade, options: Kraken.TradeOptions) => {
  const path = '/0/private/AddOrder';
  const url = `${getHttpPrefix(trade.network)}${path}`;
  const base = trade.pair.base;
  const quote = trade.pair.quote;
  const nonce = !!options.nonce ? options.nonce : Date.now() * 1000;

  const data = qs.stringify({
    nonce,
    pair: `${base.symbol}${quote.symbol}`,
    type: trade.side.toLowerCase(),
    ordertype: trade.type.toLowerCase(),
    volume: trade.volume,
    ...(trade.type === OrderType.LIMIT && {
      price: trade.price,
    }),
  } as TradeData);

  const key = options.auth.key;
  const secret = options.auth.secret;
  const signature = generateSignature(data, path, secret, nonce);

  try {
    const response = (await axios.post(url, data, {
      headers: {
        'API-Key': key,
        'API-Sign': signature,
      },
    })).data;

    if (response.error && !!response.error.length) {
      throw new Error(response.error);
    }

    return response.result;
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;

    throw error;
  }
};
