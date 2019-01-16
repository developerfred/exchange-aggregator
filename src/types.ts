import {
  TokenInterface,
  QuantityInterface,
  PriceInterface,
} from '@melonproject/token-math';

export enum Exchange {
  'RADAR_RELAY' = 'RADAR_RELAY',
  'KRAKEN' = 'KRAKEN',
  'KYBER_NETWORK' = 'KYBER_NETWORK',
  'ETHFINEX' = 'ETHFINEX',
  'OASIS_DEX' = 'OASIS_DEX',
}

export enum Network {
  'MAINNET' = 1,
  'KOVAN' = 42,
}

export interface AssetPair {
  base: TokenInterface;
  quote: TokenInterface;
}

export interface Options {
  pair: AssetPair;
  network: Network;
}

export interface Order {
  id: string;
  exchange: Exchange;
  type: OrderType;
  trade: PriceInterface;
  cummulative?: QuantityInterface;
  original?: any;
}

export enum NormalizedMessageType {
  'SET' = 'SET',
  'REMOVE' = 'REMOVE',
  'SNAPSHOT' = 'SNAPSHOT',
}

export enum OrderType {
  'ASK' = 'ASK',
  'BID' = 'BID',
}

export type AnyOrderMessage =
  | SetOrderMessage
  | RemoveOrderMessage
  | SnapshotMessage;

export interface OrderMessage {
  event: NormalizedMessageType;
  exchange: Exchange;
}

export interface SetOrderMessage extends OrderMessage {
  exchange: Exchange;
  event: NormalizedMessageType.SET;
  id: string;
  order: Order;
}

export interface RemoveOrderMessage extends OrderMessage {
  exchange: Exchange;
  event: NormalizedMessageType.REMOVE;
  id: string;
}

export interface SnapshotMessage extends OrderMessage {
  exchange: Exchange;
  event: NormalizedMessageType.SNAPSHOT;
  orders: Order[];
}

export interface Orderbook {
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
  bids: Order[];
  asks: Order[];
}
