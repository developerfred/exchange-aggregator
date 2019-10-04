import { Authentication, CallLimit, PlaceOrderParams, OrderResult } from '../types';
import { apiRequest } from '../common';

// TODO: test

export const placeorder = async (auth: Authentication, data: PlaceOrderParams[]): Promise<OrderResult[]> => {
  // up to 4 trading pairs and a maximum of 10 orders per trading pair can be placed at a time.
  const limit = {
    limit: 50,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/spot/v3/batch_orders`, '', data)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderResult[];
};
