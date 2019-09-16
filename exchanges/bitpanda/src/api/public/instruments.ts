import { publicRequest } from '../common';
import { instrumentsResponse } from '../types';

export const instruments = async (): Promise<instrumentsResponse[]> => {
  const response = (await publicRequest('get', `instruments/`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as instrumentsResponse[];
};
