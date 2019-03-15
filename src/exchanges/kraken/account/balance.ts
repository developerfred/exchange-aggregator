import { privateRequest } from '../common';
import { Kraken } from '../types';

export const balance = async (auth: Kraken.Authentication) => {
  const response = (await privateRequest('Balance', undefined, auth)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
