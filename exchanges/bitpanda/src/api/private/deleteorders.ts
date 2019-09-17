import { privateRequest } from '../common';
import { Authentication } from '../types';

export const deleteorders = async (auth: Authentication): Promise<string[]> => {
  const response = (await privateRequest('delete', `account/orders`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as string[];
};
