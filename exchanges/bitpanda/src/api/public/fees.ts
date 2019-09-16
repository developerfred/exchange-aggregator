import { publicRequest } from '../common';
import { feesResponse } from '../types';

export const fees = async (): Promise<feesResponse[]> => {
  const response = (await publicRequest('get', `fees`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as feesResponse[];
};
