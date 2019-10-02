import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

export const wallet = async (auth: Authentication): Promise<any> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/account/v3/wallet`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
