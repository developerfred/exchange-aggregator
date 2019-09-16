import { publicRequest } from '../common';
import { currenciesResponse } from '../types';

export const currencies = async (): Promise<currenciesResponse[]> => {
  const response = (await publicRequest('get', `currencies`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as currenciesResponse[];
};
