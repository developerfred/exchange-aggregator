import * as R from 'ramda';
import {
  getActiveOasisDexOrders,
  getTokenBySymbol,
} from '@melonproject/protocol';
import { OrderbookOrder, Exchange, AskOrBid } from '../../types';
import { QuantityInterface, createPrice } from '@melonproject/token-math';
import { OasisDex } from './types';

interface OasisDexOrder {
  id: number;
  buy: QuantityInterface;
  sell: QuantityInterface;
}

const exchangePath = ['thirdPartyContracts', 'exchanges', 'matchingMarket'];
const contractPath = ['melonContracts', 'adapters', 'matchingMarketAccessor'];

export const fetch = async (
  options: OasisDex.FetchOptions,
): Promise<OrderbookOrder[]> => {
  const environment = options.environment;
  const deployment = environment.deployment;
  const contract = R.path(contractPath, deployment);
  const exchange = R.path(exchangePath, deployment);

  const quote = getTokenBySymbol(environment, options.quote);
  const base = getTokenBySymbol(environment, options.base);

  const bidsCall = getActiveOasisDexOrders(environment, contract, {
    targetExchange: exchange,
    sellAsset: quote.address,
    buyAsset: base.address,
  });

  const asksCall = getActiveOasisDexOrders(environment, contract, {
    targetExchange: exchange,
    sellAsset: quote.address,
    buyAsset: base.address,
  });

  const [bidsResponse, asksResponse] = await Promise.all([bidsCall, asksCall]);

  const bids = bidsResponse.map(
    (order: OasisDexOrder): OrderbookOrder => {
      const key = `${Exchange.OASIS_DEX}:${AskOrBid.BID}:${order.id}`;
      const id = Buffer.from(key).toString('base64');
      const trade = createPrice(order.buy, order.sell);

      return {
        id,
        exchange: Exchange.OASIS_DEX,
        type: AskOrBid.BID,
        trade,
        original: {
          id: order.id,
        },
      } as OrderbookOrder;
    },
  );

  const asks = asksResponse.map(
    (order: OasisDexOrder): OrderbookOrder => {
      const key = `${Exchange.OASIS_DEX}:${AskOrBid.ASK}:${order.id}`;
      const id = Buffer.from(key).toString('base64');
      const trade = createPrice(order.sell, order.buy);

      return {
        id,
        exchange: Exchange.OASIS_DEX,
        type: AskOrBid.ASK,
        trade,
        original: {
          id: order.id,
        },
      } as OrderbookOrder;
    },
  );

  return [].concat(bids, asks);
};
