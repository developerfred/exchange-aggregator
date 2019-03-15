import axios from 'axios';
import { RadarRelay } from './types';
import { OrderbookOrder, AskOrBid, Exchange, Network } from '../../types';
import { createPrice, createQuantity } from '@melonproject/token-math';
import { RadarSignedOrder, RadarBook } from '@radarrelay/types';

// Radar relay has a different symbol for our MLN
export const mlnToMlnt = (token: string) => token.replace(/^MLN$/, 'MLNT');

export const getHttpUrl = (options: RadarRelay.Options) => {
  const base = options.base;
  const quote = options.quote;

  switch (options.network) {
    case Network.KOVAN: {
      const prefix = 'https://api.kovan.radarrelay.com';
      return `${prefix}/v2/markets/${mlnToMlnt(base)}-${mlnToMlnt(quote)}/book`;
    }

    case Network.MAINNET: {
      const prefix = 'https://api.radarrelay.com';
      return `${prefix}/v2/markets/${base}-${quote}/book`;
    }

    default:
      throw new Error('Invalid network.');
  }
};

export const fetchRadarBook = (options: RadarRelay.Options) => {
  const url = getHttpUrl(options);
  return axios.get(url).then(result => result.data as RadarBook);
};

export const normalizeOrder = (
  options: RadarRelay.Options,
  order: RadarSignedOrder,
): OrderbookOrder => {
  const oid = Buffer.from(order.orderHash).toString('base64');
  const base = parseFloat((order.remainingBaseTokenAmount as any) as string);
  const quote = parseFloat((order.remainingQuoteTokenAmount as any) as string);

  const trade = createPrice(
    createQuantity(options.base, base),
    createQuantity(options.quote, quote),
  );

  return {
    id: oid,
    exchange: Exchange.RADAR_RELAY,
    type: (order.type as any) as AskOrBid,
    trade,
    original: order,
  };
};
