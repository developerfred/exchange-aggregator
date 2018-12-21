export enum Exchange {
  'RADAR_RELAY' = 'RADAR_RELAY',
  'KRAKEN' = 'KRAKEN',
  'KYBER' = 'KYBER',
}

export enum Network {
  'MAINNET' = 1,
  'KOVAN' = 42,
}

export interface Options {
  base: string;
  quote: string;
  network: Network;
}

export interface Order {
  price: number;
  volume: number;
  id?: string;
  metadata?: any;
}

export enum StandardizedMessageType {
  'ADD' = 'ADD',
  'REMOVE' = 'REMOVE',
  'FILL' = 'FILL',
  'SNAPSHOT' = 'SNAPSHOT',
}

export type OrderType = 'ASK' | 'BID';

export interface OrderMessage {
  id: string;
  type: OrderType;
  event: StandardizedMessageType;
  exchange: Exchange;
}

export interface AddOrderMessage extends OrderMessage {
  event: StandardizedMessageType.ADD;
  order: Order;
}

export interface RemoveOrderMessage extends OrderMessage {
  event: StandardizedMessageType.REMOVE;
}

export interface FillOrderMessage extends OrderMessage {
  event: StandardizedMessageType.FILL;
  order: Order;
}

export interface SnapshotMessage {
  event: StandardizedMessageType.SNAPSHOT;
  exchange: Exchange;
  asks: Order[];
  bids: Order[];
}
