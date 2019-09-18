import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';

export type Symbol = string;

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}

export interface TokenAssetPair {
  base: Token;
  quote: Token;
}

export interface SymbolAssetPair {
  base: Symbol;
  quote: Symbol;
}

export type OrderbookObserver<O = {}, A extends Symbol | Token = Symbol> = (options?: O) => Rx.Observable<Orderbook<A>>;
export type OrderbookFetcher<O = {}, A extends Symbol | Token = Symbol> = (options?: O) => Promise<Orderbook<A>>;

export interface Orderbook<A extends Symbol | Token = Symbol> {
  base: A;
  quote: A;
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
}

export interface OrderbookEntry {
  price: BigNumber;
  volume: BigNumber;
}
