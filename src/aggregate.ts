import * as R from 'ramda';
import {
  Order,
  Options,
  SnapshotMessage,
  NormalizedMessageType,
  OrderType,
  RemoveOrderMessage,
  SetOrderMessage,
  AnyOrderMessage,
} from './types';
import {
  TokenInterface,
  toAtomic,
  add,
  subtract,
  createQuantity,
  BigInteger,
} from '@melonproject/token-math';

export const isBidOrder = R.propEq('type', OrderType.BID);
export const isAskOrder = R.propEq('type', OrderType.ASK);

export const createOrderbook = (options: Options, orders: Order[]) => {
  const asks = orders
    .filter(isAskOrder)
    .sort(sortOrders)
    .reduce(reduceOrderVolumes, []);

  const bids = orders
    .filter(isBidOrder)
    .sort(sortOrders)
    .reduce(reduceOrderVolumes, []);

  return {
    quote: options.pair.quote,
    base: options.pair.quote,
    network: options.network,
    asks,
    bids,
  };
};

export const sortOrders = (a: Order, b: Order) => {
  const priceA = toAtomic(a.trade);
  const priceB = toAtomic(b.trade);
  const difference = parseFloat(subtract(priceB, priceA).toString());

  // Sort by volumes if prices are identical.
  if (difference === 0) {
    const quantityA = a.trade.base.quantity;
    const quantityB = b.trade.base.quantity;
    return parseFloat(subtract(quantityA, quantityB).toString());
  }

  return difference;
};

export const reduceOrderVolumes = (
  carry: Order[],
  order: Order,
  index: number,
) => {
  const tokenPath = ['trade', 'base', 'token'];
  const token = R.path(tokenPath, order) as TokenInterface;

  const volumePath = ['trade', 'base', 'quantity'];
  const volume = R.path(volumePath, order) as BigInteger;

  const previousPath = [index - 1, 'cummulative', 'quantity'];
  const previous = R.pathOr(0, previousPath, carry) as BigInteger;

  const cummulative = add(
    createQuantity(token, volume),
    createQuantity(token, previous),
  );

  const current = {
    ...order,
    cummulative,
  };

  return (carry || []).concat([current]);
};

export const reduceOrderEvents = (carry: Order[], current: AnyOrderMessage) => {
  if (current.event === NormalizedMessageType.SNAPSHOT) {
    const snapshot = current as SnapshotMessage;

    return carry
      .filter(item => item.exchange !== snapshot.exchange)
      .concat(snapshot.orders);
  }

  if (current.event === NormalizedMessageType.SET) {
    const add = current as SetOrderMessage;
    return carry.filter(item => item.id !== add.id).concat([add.order]);
  }

  if (current.event === NormalizedMessageType.REMOVE) {
    const remove = current as RemoveOrderMessage;
    return carry.filter(order => order.id !== remove.id);
  }

  return carry;
};
