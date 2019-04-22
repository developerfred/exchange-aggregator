import { privateRequest } from '../common';
import { Authentication, OrderType, SellOrBuy } from '../types';

export interface AddOrderResponse {}

export interface AddOrderParams {
  pair: string;
  type: SellOrBuy;
  ordertype: OrderType;
  volume: string;
  price?: string;
  price2?: string;
  leverage?: string;
  oflags?: string[];
  starttm?: number;
  expiretm?: number;
  userref?: number;
  validate?: boolean;
}

export const addOrder = async (
  auth: Authentication,
  params: AddOrderParams,
): Promise<AddOrderResponse> => {
  const args = {
    ...params,
    ...(params.oflags && { oflags: params.oflags.join(',') }),
  };

  const response = (await privateRequest('AddOrder', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
