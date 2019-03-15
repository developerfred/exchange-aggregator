import { Exchange, AskOrBid, OrderbookOrder } from '../../../types';
import { Kraken } from '../types';
import { createPrice, createQuantity } from '@melonproject/token-math';

export type KrakenOrder = [number, number, number];

export const normalizeOrder = (
  options: Kraken.Options,
  type: AskOrBid,
  [price, volume]: KrakenOrder,
): OrderbookOrder => {
  const oid = Buffer.from(`${Exchange.KRAKEN}:${price}`).toString('base64');

  const trade = createPrice(
    createQuantity(options.base, volume),
    createQuantity(options.quote, price * volume),
  );

  return {
    id: oid,
    exchange: Exchange.KRAKEN,
    type,
    trade,
  };
};
