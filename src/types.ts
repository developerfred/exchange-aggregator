import { PriceInterface } from '@melonproject/token-math/price';
import { TokenInterface } from '@melonproject/token-math/token';
import { QuantityInterface } from '@melonproject/token-math/quantity';

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
  original?: any;
}

export interface AggregatedOrder extends Order {
  cummulative: QuantityInterface;
}

export enum NormalizedMessageType {
  'ADD' = 'ADD',
  'REMOVE' = 'REMOVE',
  'SNAPSHOT' = 'SNAPSHOT',
}

export enum OrderType {
  'ASK' = 'ASK',
  'BID' = 'BID',
}

export interface OrderMessage {
  id: string;
  event: NormalizedMessageType;
  exchange: Exchange;
}

export interface AddOrUpdateOrderMessage extends OrderMessage {
  event: NormalizedMessageType.ADD;
  order: Order;
}

export interface RemoveOrderMessage extends OrderMessage {
  event: NormalizedMessageType.REMOVE;
}

export interface SnapshotMessage {
  event: NormalizedMessageType.SNAPSHOT;
  exchange: Exchange;
  orders: Order[];
}
