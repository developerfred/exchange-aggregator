import { Exchange, OrderType, Order } from '../../types';
import { Kraken } from './types';
import { createPrice, createQuantity } from '@melonproject/token-math';

export type KrakenOrder = [number, number, number];

export const normalizeOrder = (
  options: Kraken.Options,
  type: OrderType,
  [price, volume]: KrakenOrder,
): Order => {
  const oid = Buffer.from(`${Exchange.KRAKEN}:${price}`).toString('base64');

  const trade = createPrice(
    createQuantity(options.pair.base, volume),
    createQuantity(options.pair.quote, price * volume),
  );

  return {
    id: oid,
    exchange: Exchange.KRAKEN,
    type,
    trade,
  };
};
