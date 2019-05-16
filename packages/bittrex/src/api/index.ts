import {
  publicRequest,
  privateRequest,
  generateSignature,
  generateContentHash,
} from './common';
import { orderbook } from './markets/orderbook';
import { balances } from './account/balances';
import { add } from './orders/add';
import { get } from './orders/get';
import { cancel } from './orders/cancel';

export const common = {
  publicRequest,
  privateRequest,
  generateSignature,
  generateContentHash,
};

export const orders = {
  get,
  add,
  cancel,
};

export const account = {
  balances,
};

export const markets = {
  orderbook,
};
