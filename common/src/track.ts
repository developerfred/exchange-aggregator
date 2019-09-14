import * as Rx from 'rxjs';
import { Orderbook, Symbol, Token } from './types';

export const update = <T extends Symbol | Token>(
  subscriber: Rx.Subscriber<Orderbook<T>>,
  depth: number,
  state: (message: Orderbook<T>) => Orderbook<T>,
) => (message: Orderbook<T>) => {
  const current = state(message);

  message.asks.forEach(ask => {
    current.asks = current.asks.filter(item => !item.price.isEqualTo(ask.price));
  });

  message.bids.forEach(bid => {
    current.bids = current.bids.filter(item => !item.price.isEqualTo(bid.price));
  });

  current.asks = current.asks
    .concat(message.asks)
    .sort((a, b) => a.price.comparedTo(b.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  current.bids = current.bids
    .concat(message.bids)
    .sort((a, b) => b.price.comparedTo(a.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  subscriber.next(current);
};

export const snapshot = <T extends Symbol | Token>(
  subscriber: Rx.Subscriber<Orderbook<T>>,
  depth: number,
  state: (message: Orderbook<T>) => Orderbook<T>,
) => (message: Orderbook<T>) => {
  const current = state(message);

  current.asks = message.asks
    .sort((a, b) => a.price.comparedTo(b.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  current.bids = message.bids
    .sort((a, b) => b.price.comparedTo(a.price))
    .filter(item => !item.volume.isEqualTo(0))
    .slice(0, depth);

  subscriber.next(current);
};
