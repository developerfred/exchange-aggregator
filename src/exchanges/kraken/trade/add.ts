import axios from 'axios';
import crypto from 'crypto';
import qs from 'qs';
import { getHttpPrefix } from '../common';
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

const generateSignature = (
  data: TradeData,
  path: string,
  secret: string,
  nonce: any,
) => {
  const secretBuffer = new Buffer(secret, 'base64');
  const hash = crypto.createHash('sha256');
  const hmac = crypto.createHmac('sha512', secretBuffer);
  const hashDigest = hash.update(nonce + data).digest('binary' as any);
  const hmacDigest = hmac
    .update(path + hashDigest, 'binary' as any)
    .digest('base64');

  return hmacDigest;
};

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
  return axios.post(url, data, {
    headers: {
      'API-Key': key,
      'API-Sign': signature,
    },
  });
};
