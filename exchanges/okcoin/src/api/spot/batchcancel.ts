import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

// TODO: test

export interface BatchCancelParams {
  instrument_id: string;
  client_oids: string[];
}

export const batchcancel = async (auth: Authentication, data: BatchCancelParams): Promise<any> => {
  // cancel all open orders for specific trading pairs.
  // For each request, orders for Up to 4 trading pairs and a maximum of 10 orders per trading pair can be canceled.
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/spot/v3/cancel_batch_orders`, '', data)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
