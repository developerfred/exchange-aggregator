export enum Exchange {
  'RADAR_RELAY' = 'RADAR_RELAY',
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
  id: string;
  original: any;
}

export enum StandardizedMessageType {
  'ADD' = 'ADD',
  'REMOVE' = 'REMOVE',
  'FILL' = 'FILL',
  'SNAPSHOT' = 'SNAPSHOT',
}

export interface OrderMessage {
  type: StandardizedMessageType;
  id: string;
  exchange: Exchange;
}

export interface AddOrderMessage extends OrderMessage {
  type: StandardizedMessageType.ADD;
  order: Order;
}

export interface RemoveOrderMessage extends OrderMessage {
  type: StandardizedMessageType.REMOVE;
}

export interface FillOrderMessage extends OrderMessage {
  type: StandardizedMessageType.FILL;
  order: Order;
}

export interface SnapshotMessage {
  type: StandardizedMessageType.SNAPSHOT;
  exchange: Exchange;
  snapshot: Order[];
}
