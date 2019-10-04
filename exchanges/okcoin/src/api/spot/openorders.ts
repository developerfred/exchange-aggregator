import { Authentication, CallLimit, OpenOrdersParams, OpenOrdersResponse } from '../types';
import { apiRequest } from '../common';

export const openorders = async (auth: Authentication, params: OpenOrdersParams): Promise<OpenOrdersResponse> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/spot/v3/orders\_pending`, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OpenOrdersResponse;
};
