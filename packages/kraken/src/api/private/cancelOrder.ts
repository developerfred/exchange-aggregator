import { privateRequest } from '../common';
import { Authentication } from '../types';

export interface CancelOrderResponse {}

export interface CancelOrderParams {
  txid: string;
}

export const cancelOrder = async (
  auth: Authentication,
  params: CancelOrderParams,
): Promise<CancelOrderResponse> => {
  const response = (await privateRequest('CancelOrder', auth, params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
