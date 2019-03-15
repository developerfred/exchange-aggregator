import { privateRequest } from '../common';
import { Kraken } from '../types';

export const cancel = async (txid: string, auth: Kraken.Authentication) => {
  const response = (await privateRequest('CancelOrder', { txid }, auth)).data;

  if (response.error && !!response.error.length) {
    if (
      !!(response.error as string[]).find(error => {
        return error === 'EOrder:Unknown order';
      })
    ) {
      return {};
    }

    throw new Error(response.error);
  }

  return response.result;
};
