import { publicRequest } from '../common';
import { FeesResponse } from '../types';

export const fees = async (): Promise<FeesResponse[]> => {
  const response = (await publicRequest('get', `fees`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as FeesResponse[];
};
