import { Authentication, CallLimit, OrdersListParams } from '../types';
import { apiRequest } from '../common';

// TODO: test

export const orderslist = async (auth: Authentication, params: OrdersListParams): Promise<any> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/spot/v3/orders`, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
