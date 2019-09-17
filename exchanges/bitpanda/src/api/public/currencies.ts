import { publicRequest } from '../common';
import { CurrenciesResponse } from '../types';

export const currencies = async (): Promise<CurrenciesResponse[]> => {
  const response = (await publicRequest('get', `currencies`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as CurrenciesResponse[];
};
