export * from './types';

import * as allExchanges from './exchanges';
export const exchanges = allExchanges;

export {
  isAskOrder,
  isBidOrder,
  createOrderbook,
  sortOrders,
  reduceOrderEvents,
  reduceOrderVolumes,
} from './aggregate';

export {
  isOrderEvent,
  isSetOrderEvent,
  isRemoveOrderEvent,
  isSnapshotEvent,
} from './events';

export { Ethfinex } from './exchanges/ethfinex/types';
export { Kraken } from './exchanges/kraken/types';
export { Kyber } from './exchanges/kyber/types';
export { OasisDex } from './exchanges/oasisdex/types';
export { RadarRelay } from './exchanges/radarrelay/types';
