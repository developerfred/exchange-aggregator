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

export const aggregateOrderbook = (
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
      bids: carry.bids.filter(item => item.exchange !== exchange).concat(bids),
      // .sort(sortBids), // TODO: Add sorting.
      asks: carry.asks.filter(item => item.exchange !== exchange).concat(asks),
      // .sort(sortAsks), // TODO: Add sorting.
    };
  }

  if (current.event === NormalizedMessageType.ADD) {
    const add = current as AddOrUpdateOrderMessage;
    const { id, exchange, order } = add;

    return {
      ...carry,
      asks:
        order.type === OrderType.ASK
          ? carry.asks
              .filter(item => !(item.id === id && item.exchange === exchange))
              .concat([order])
          : // .sort(sortBids), // TODO: Add sorting.
            carry.asks,
      bids:
        order.type === OrderType.BID
          ? carry.bids
              .filter(item => !(item.id === id && item.exchange === exchange))
              .concat([order])
          : // .sort(sortAsks), // TODO: Add sorting.
            carry.bids,
    };
  }

  if (current.event === NormalizedMessageType.REMOVE) {
    const remove = current as RemoveOrderMessage;
    const { id, exchange } = remove;

    return {
      ...carry,
      asks: carry.asks.filter(
        order => !(order.id === id && order.exchange === exchange),
      ),
      bids: carry.bids.filter(
        order => !(order.id === id && order.exchange === exchange),
      ),
    };
  }

  return carry;
};
