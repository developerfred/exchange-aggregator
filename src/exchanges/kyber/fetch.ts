import * as R from 'ramda';
import { Kyber } from './types';
import { Order, Exchange, OrderType } from '../../types';
import { getExpectedRate } from '@melonproject/protocol';
import {
  createQuantity,
  PriceInterface,
  createPrice,
  multiply,
  isZero,
  normalize,
} from '@melonproject/token-math';

export interface Currency {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
  id: string;
}

const proxyPath = [
  'thirdPartyContracts',
  'exchanges',
  'kyber',
  'kyberNetworkProxy',
];

export const fetch = async (options: Kyber.FetchOptions): Promise<Order[]> => {
  const quantities = options.quantities || [1, 10, 100, 1000];
  const environment = options.environment;
  const deployment = environment.deployment;
  const proxy = R.path(proxyPath, deployment);

  const bidQuantities = quantities.map(quantity => {
    return createQuantity(options.pair.quote, quantity);
  });

  const bidsPromise = Promise.all(
    bidQuantities.map(quantity => {
      return getExpectedRate(environment, proxy, {
        takerAsset: options.pair.quote,
        makerAsset: options.pair.base,
        fillTakerQuantity: quantity,
      });
    }),
  ).then(response =>
    response.filter((price: PriceInterface) => {
      return !isZero(price.quote.quantity);
    }),
  );

  const askQuantities = quantities.map(quantity => {
    return createQuantity(options.pair.base, quantity);
  });

  const asksPromise = Promise.all(
    askQuantities.map(quantity => {
      return getExpectedRate(environment, proxy, {
        takerAsset: options.pair.base,
        makerAsset: options.pair.quote,
        fillTakerQuantity: quantity,
      });
    }),
  ).then(response =>
    response.filter((price: PriceInterface) => {
      return !isZero(price.quote.quantity);
    }),
  );

  const [bidsResponse, asksResponse] = await Promise.all([
    bidsPromise,
    asksPromise,
  ]);

  const bids = bidsResponse.map(
    (bid: PriceInterface, index): Order => {
      const volume = quantities[index];
      const normalized = normalize(createPrice(bid.quote, bid.base));
      const base = normalized.base;
      const quote = normalized.quote;
      const trade = createPrice(
        createQuantity(base.token, multiply(base.quantity, volume)),
        createQuantity(quote.token, multiply(quote.quantity, volume)),
      );

      const pair = `${base.token.address}:${quote.token.address}`;
      const key = `${Exchange.KYBER_NETWORK}:${pair}:${volume}`;
      const id = Buffer.from(key).toString('base64');

      return {
        id,
        exchange: Exchange.KYBER_NETWORK,
        type: OrderType.BID,
        trade,
      } as Order;
    },
  );

  const asks = asksResponse.map((ask: PriceInterface, index) => {
    const volume = quantities[index];
    const base = ask.base;
    const quote = ask.quote;
    const trade = createPrice(
      createQuantity(base.token, multiply(base.quantity, volume)),
      createQuantity(quote.token, multiply(quote.quantity, volume)),
    );

    const pair = `${base.token.address}:${quote.token.address}`;
    const key = `${Exchange.KYBER_NETWORK}:${pair}:${volume}`;
    const id = Buffer.from(key).toString('base64');

    return {
      id,
      exchange: Exchange.KYBER_NETWORK,
      type: OrderType.ASK,
      trade,
    } as Order;
  });

  return [].concat(bids, asks);
};
