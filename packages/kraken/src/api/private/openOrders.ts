import { privateRequest } from '../common';
import { Authentication, OrderInfo } from '../types';

export interface OpenOrdersResponse {
  open: {
    [key: string]: OrderInfo;
  };
}

export interface OpenOrdersParams {
  trades?: boolean;
  userref?: string;
}

export const openOrders = async (
  auth: Authentication,
  params?: OpenOrdersParams,
): Promise<OpenOrdersResponse> => {
  const response = (await privateRequest('OpenOrders', auth, params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
