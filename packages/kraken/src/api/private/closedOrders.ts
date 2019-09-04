import { privateRequest } from '../common';
import { OrderInfo, Authentication } from '../types';

export interface ClosedOrdersResponse {
  count: number;
  closed: {
    [key: string]: OrderInfo;
  };
}

export interface ClosedOrdersParams {
  ofs: number;
  trades?: boolean;
  userref?: string;
  start?: number;
  end?: number;
  closetime?: 'open' | 'close' | 'both';
}

export const closedOrders = async (
  auth: Authentication,
  params?: ClosedOrdersParams,
): Promise<ClosedOrdersResponse> => {
  const response = (await privateRequest('ClosedOrders', auth, params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
