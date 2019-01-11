import * as R from 'ramda';
import { Environment, getActiveOasisDexOrders } from '@melonproject/protocol';
import { Order, Exchange, OrderType, Options } from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { QuantityInterface } from '@melonproject/token-math/quantity';

// const debug = require('debug')('exchange-aggregator:oasis-dex');

export interface OasisDexOptions extends Options {
  environment: Environment;
}

interface OasisDexOrder {
  id: number;
  buy: QuantityInterface;
  sell: QuantityInterface;
}

const exchangePath = ['thirdPartyContracts', 'exchanges', 'matchingMarket'];

const contractPath = ['melonContracts', 'adapters', 'matchingMarketAccessor'];

export const fetchOasisDexOrders = async (
  options: OasisDexOptions,
): Promise<Order[]> => {
  const environment = options.environment;
  const deployment = environment.deployment;
  const contract = R.path(contractPath, deployment);
  const exchange = R.path(exchangePath, deployment);

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
      const key = `${Exchange.OASIS_DEX}:${OrderType.BID}:${order.id}`;
      const id = Buffer.from(key).toString('base64');

      return {
        id,
        type: OrderType.BID,
        exchange: Exchange.OASIS_DEX,
        trade: createPrice(order.buy, order.sell),
      };
    },
  );

  const asks = asksResponse.map(
    (order: OasisDexOrder): Order => {
      const key = `${Exchange.OASIS_DEX}:${OrderType.ASK}:${order.id}`;
      const id = Buffer.from(key).toString('base64');

      return {
        id,
        type: OrderType.ASK,
        exchange: Exchange.OASIS_DEX,
        trade: createPrice(order.sell, order.buy),
      };
    },
  );

  return [].concat(bids, asks);
};
