import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

export const accounts = async (auth: Authentication): Promise<any> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/spot/v3/accounts`)).data;

  console.log('test');

  // if (response.error && !!response.error.length) {
  //     throw new Error(response.error);
  // }

  return response as any;
};
