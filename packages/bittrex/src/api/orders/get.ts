import { privateRequest, Authentication, HttpMethod } from '../common';

export interface GetOrderParams {
  id: string;
}

export interface GetOrderResponse {
  id: string;
  marketSymbol: string;
  direction: string;
  type: string;
  quantity: number;
  limit: number;
  ceiling: number;
  timeInForce: string;
  expiresAt: string;
  clientOrderId: string;
  fillQuantity: number;
  commission: number;
  proceeds: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string;
}

export const get = async (auth: Authentication, params: GetOrderParams) => {
  const method = `orders/${params.id}`;
  const response = await privateRequest<GetOrderResponse>(method, auth, undefined, HttpMethod.GET);

  return response;
};
