import { privateRequest } from '../common';
import { OrderInfo, Authentication } from '../types';

export interface QueryOrdersResponse {
  [key: string]: OrderInfo;
}

export interface QueryOrdersParams {
  txid: string[];
  trades?: boolean;
  userref?: boolean;
}

export const queryOrders = async (
  auth: Authentication,
  params: QueryOrdersParams,
): Promise<QueryOrdersResponse> => {
  const args = {
    ...params,
    ...(params.txid && { txid: params.txid.join(',') }),
  };

  const response = (await privateRequest('QueryOrders', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
