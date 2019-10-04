import { Authentication, CallLimit, PlaceOrderParams, OrderResult } from '../types';
import { apiRequest } from '../common';

export const placeorder = async (auth: Authentication, data: PlaceOrderParams): Promise<OrderResult> => {
  const limit = {
    limit: 100,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/spot/v3/orders`, '', data)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderResult;
};
