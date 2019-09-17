import { privateRequest } from '../common';
import { Authentication, OrderResponse } from '../types';

export const getorder = async (auth: Authentication, order_id: string): Promise<OrderResponse> => {
  const response = (await privateRequest('get', `account/orders/${order_id}`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderResponse;
};
