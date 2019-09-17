export { Authentication } from './types';

/* REST PUBLIC */
export { orderbook } from './public/orderbook';
export { time } from './public/time';
export { instruments } from './public/instruments';
export { fees } from './public/fees';
export { currencies } from './public/currencies';

/* REST PRIVATE */
export { balances } from './private/balances';
export { getorders } from './private/getorders';

/* WEBSOCKET */
export { subscribe } from './websocket';
