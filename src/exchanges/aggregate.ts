import {
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

export interface Orderbook {
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
  bids: Order[];
  asks: Order[];
}

export const initializeOrderbook = (options: Options) => ({
  quote: options.pair.quote,
  base: options.pair.quote,
  network: options.network,
  bids: [],
  asks: [],
});

const sortOrders = (a: Order, b: Order) => {
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

export const aggregateOrderbookFromOrders = (
  carry: Orderbook,
  current: Order[],
) => {
  const bids = current.filter(order => order.type === OrderType.BID);
  const asks = current.filter(order => order.type === OrderType.ASK);

  return {
    ...carry,
    bids: carry.bids.concat(bids).sort(sortOrders),
    asks: carry.asks.concat(asks).sort(sortOrders),
  };
};

export const aggregateOrderbookFromEvents = (
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
