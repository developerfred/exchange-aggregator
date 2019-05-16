import { privateRequest, Authentication, HttpMethod } from '../common';

export interface CancelOrderParams {
  id: string;
}

export interface CancelOrderResponse {
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

export const cancel = async (
  auth: Authentication,
  params: CancelOrderParams,
) => {
  const method = `orders/${params.id}`;
  const response = await privateRequest<CancelOrderResponse>(
    method,
    auth,
    undefined,
    HttpMethod.DELETE,
  );

  return response;
};
