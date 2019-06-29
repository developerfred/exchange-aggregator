import BigNumber from 'bignumber.js';

export interface AssetPair {
  base: string;
  quote: string;
}

export enum OrderbookEventType {
  SNAPSHOT = 'SNAPSHOT',
  UPDATE = 'UPDATE',
}

export type OrderbookEvent = OrderbookUpdateEvent | OrderbookSnapshotEvent;

export interface OrderbookUpdateEvent {
  type: OrderbookEventType.UPDATE;
  order: OrderbookEntry;
}

export interface OrderbookSnapshotEvent {
  type: OrderbookEventType.SNAPSHOT;
  orders: OrderbookEntry[];
}

export interface OrderbookEntry {
  price: BigNumber;
  volume: BigNumber;
}
