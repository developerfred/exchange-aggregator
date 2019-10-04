import { Authentication, CallLimit, OrderResult } from '../types';
import { apiRequest } from '../common';

export const cancelorders = async (
  auth: Authentication,
  order_id: string,
  instrument_id: string,
): Promise<OrderResult> => {
  const limit = {
    limit: 100,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/spot/v3/cancel_orders/${order_id}`, '', {
    instrument_id: instrument_id,
  })).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderResult;
};
