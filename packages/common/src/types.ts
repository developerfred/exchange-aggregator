import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}

export interface AssetPair {
  base: Token;
  quote: Token;
}

export type OrderbookObserver<O = {}> = (pairs: AssetPair[], options?: O) => Rx.Observable<OrderbookUpdate>;

export interface OrderbookUpdate {
  base: Token;
  quote: Token;
  depth: number;
  snapshot: boolean;
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
}

export interface OrderbookEntry {
  price: BigNumber;
  volume: BigNumber;
}
