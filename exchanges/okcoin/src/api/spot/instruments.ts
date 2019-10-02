import { Authentication, CallLimit, InstrumentsResponse } from '../types';
import { apiRequest } from '../common';

export const instruments = async (auth: Authentication): Promise<InstrumentsResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/spot/v3/instruments`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as InstrumentsResponse[];
};
