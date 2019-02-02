import axios from 'axios';
import { RadarRelay } from './types';
import { Order, OrderType, Exchange, Network } from '../../types';
import { createPrice, createQuantity } from '@melonproject/token-math';
import { RadarSignedOrder, RadarBook } from '@radarrelay/types';

// Radar relay has a different symbol for our MLN
export const mlnToMlnt = (token: string) => token.replace(/^MLN$/, 'MLNT');

export const getHttpUrl = (options: RadarRelay.Options) => {
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;

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
): Order => {
  const oid = Buffer.from(order.orderHash).toString('base64');
  const base = parseFloat((order.remainingBaseTokenAmount as any) as string);
  const quote = parseFloat((order.remainingQuoteTokenAmount as any) as string);

  const price = createPrice(
    createQuantity(options.pair.base, base),
    createQuantity(options.pair.quote, quote),
  );

  return {
    id: oid,
    exchange: Exchange.RADAR_RELAY,
    type: (order.type as any) as OrderType,
    trade: price,
    original: order,
  };
};
