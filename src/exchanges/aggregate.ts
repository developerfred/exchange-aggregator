import * as R from 'ramda';
import {
  AggregatedOrder,
  Order,
  Options,
  Network,
  OrderMessage,
  SnapshotMessage,
  NormalizedMessageType,
  OrderType,
  RemoveOrderMessage,
  AddOrUpdateOrderMessage,
} from '../types';
import { TokenInterface } from '@melonproject/token-math/token';
import { toAtomic } from '@melonproject/token-math/price';
import { subtract } from '@melonproject/token-math/bigInteger';
import {
  add as addQuantity,
  createQuantity,
  QuantityInterface,
} from '@melonproject/token-math/quantity';

export interface AsksAndBids {
  bids: (AggregatedOrder | Order)[];
  asks: (AggregatedOrder | Order)[];
}

export interface Orderbook extends AsksAndBids {
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
}

export const createOrderbook = (options: Options, orders?: AsksAndBids) => ({
  quote: options.pair.quote,
  base: options.pair.quote,
  network: options.network,
  asks: (orders && orders.asks) || [],
  bids: (orders && orders.bids) || [],
});

export const sortOrders = (
  a: Order | AggregatedOrder,
  b: Order | AggregatedOrder,
) => {
  const priceA = toAtomic(a.trade);
  const priceB = toAtomic(b.trade);
  const difference = parseFloat(subtract(priceB, priceA).toString());

  // Sort by volumes if prices are identical.
  if (difference === 0) {
    const quantityA = a.trade.base.quantity;
    const quantityB = b.trade.base.quantity;
    return parseFloat(subtract(quantityB, quantityA).toString());
  }

  return difference;
};

export const reduceCummulativeVolumes = (
  carry: AggregatedOrder[] = [],
  order: Order,
  index: number,
) => {
  const token = R.path(['trade', 'base', 'token'], order) as TokenInterface;
  const current = R.path(['trade', 'base', 'quantity'], order) as number;
  const previous = R.path(
    [index - 1, 'cummulative'],
    carry,
  ) as QuantityInterface;
  const cummulative = addQuantity(
    createQuantity(token, current),
    previous || createQuantity(token, 0),
  );

  return (carry || []).concat([
    {
      ...order,
      cummulative,
    },
  ]);
};

export const isBidOrder = R.propEq('type', OrderType.BID);
export const isAskOrder = R.propEq('type', OrderType.ASK);

export const aggregateOrders = (orders: Order[]): AsksAndBids => {
  const asks = orders.filter(isAskOrder);
  const bids = orders.filter(isBidOrder);

  return {
    asks: asks.reduce(reduceCummulativeVolumes, []),
    bids: bids.reduce(reduceCummulativeVolumes, []),
  };
};

export const aggregateEvents = (
  carry: Orderbook,
  current: OrderMessage | SnapshotMessage,
) => {
  if (current.event === NormalizedMessageType.SNAPSHOT) {
    const snapshot = current as SnapshotMessage;
    const bids = snapshot.orders.filter(order => order.type === OrderType.BID);
    const asks = snapshot.orders.filter(order => order.type === OrderType.ASK);
    const { exchange } = current;

    return {
      ...carry,
      bids: carry.bids
        .filter(item => item.exchange !== exchange)
        .concat(bids)
        .sort(sortOrders),
      asks: carry.asks
        .filter(item => item.exchange !== exchange)
        .concat(asks)
        .sort(sortOrders),
    };
  }

  if (current.event === NormalizedMessageType.ADD) {
    const add = current as AddOrUpdateOrderMessage;
    const { id, order } = add;

    return {
      ...carry,
      asks:
        order.type === OrderType.ASK
          ? carry.asks
              .filter(item => item.id !== id)
              .concat([order])
              .sort(sortOrders)
          : carry.asks,
      bids:
        order.type === OrderType.BID
          ? carry.bids
              .filter(item => item.id !== id)
              .concat([order])
              .sort(sortOrders)
          : carry.bids,
    };
  }

  if (current.event === NormalizedMessageType.REMOVE) {
    const remove = current as RemoveOrderMessage;
    const { id } = remove;

    return {
      ...carry,
      asks: carry.asks.filter(order => order.id !== id),
      bids: carry.bids.filter(order => order.id !== id),
    };
  }

  return carry;
};
