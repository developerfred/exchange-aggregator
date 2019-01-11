import * as R from 'ramda';
import { Environment, getActiveOasisDexOrders } from '@melonproject/protocol';
import { Order, Exchange, OrderType, Options } from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { QuantityInterface } from '@melonproject/token-math/quantity';

// const debug = require('debug')('exchange-aggregator:oasis-dex');

interface OasisDexOptions extends Options {
  environment: Environment;
}

interface OasisDexOrder {
  id: number;
  buy: QuantityInterface;
  sell: QuantityInterface;
}

export const fetchOasisDexOrders = async (
  options: OasisDexOptions,
): Promise<Order[]> => {
  const environment: Environment = R.prop('environment', options);
  const contract: string = R.path(
    [
      'environment',
      'deployment',
      'melonContracts',
      'adapters',
      'matchingMarketAccessor',
    ],
    options,
  );

  const exchange: string = R.path(
    [
      'environment',
      'deployment',
      'thirdPartyContracts',
      'exchanges',
      'matchingMarket',
    ],
    options,
  );

  const bidsCall = getActiveOasisDexOrders(environment, contract, {
    targetExchange: exchange.toString(),
    sellAsset: options.pair.quote.address.toString(),
    buyAsset: options.pair.base.address.toString(),
  });

  const asksCall = getActiveOasisDexOrders(environment, contract, {
    targetExchange: exchange,
    sellAsset: options.pair.base.address,
    buyAsset: options.pair.quote.address,
  });

  const [bidsResponse, asksResponse] = await Promise.all([bidsCall, asksCall]);

  const bids = bidsResponse.map(
    (order: OasisDexOrder): Order => {
      return {
        id: Buffer.from(`${Exchange.OASIS_DEX}:${order.id}`).toString('base64'),
        type: OrderType.BID,
        exchange: Exchange.OASIS_DEX,
        trade: createPrice(order.buy, order.sell),
      };
    },
  );

  const asks = asksResponse.map(
    (order: OasisDexOrder): Order => {
      return {
        id: Buffer.from(`${Exchange.OASIS_DEX}:${order.id}`).toString('base64'),
        type: OrderType.ASK,
        exchange: Exchange.OASIS_DEX,
        trade: createPrice(order.sell, order.buy),
      };
    },
  );

  console.log({
    targetExchange: exchange,
    sellAsset: options.pair.base.address,
    buyAsset: options.pair.quote.address,
  });

  console.log(bids, asks);

  return [].concat(bids, asks);
};
