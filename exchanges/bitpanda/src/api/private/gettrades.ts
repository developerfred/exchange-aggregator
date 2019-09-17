import { privateRequest } from '../common';
import { Authentication } from '../types';

export interface GetTradesParams {
  from?: string;
  to?: string;
  instrument_code?: string;
  max_page_size?: string;
  cursor?: string;
}

export const gettrades = async (auth: Authentication): Promise<any> => {
  const response = (await privateRequest('get', `account/trades`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
