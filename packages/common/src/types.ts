import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';

export interface AssetPair {
  base: string;
  quote: string;
}

export type OrderbookObserver<O = {}> = (pairs: AssetPair[], options?: O) => Rx.Observable<OrderbookUpdate>;

export interface OrderbookUpdate {
  base: string;
  quote: string;
  updates: OrderbookEntry[];
  snapshot?: boolean;
}

export interface OrderbookEntry {
  price: BigNumber;
  volume: BigNumber;
}
