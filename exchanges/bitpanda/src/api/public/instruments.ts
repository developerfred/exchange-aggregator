import { publicRequest } from '../common';
import { InstrumentsResponse } from '../types';

export const instruments = async (): Promise<InstrumentsResponse[]> => {
  const response = (await publicRequest('get', `instruments/`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as InstrumentsResponse[];
};
