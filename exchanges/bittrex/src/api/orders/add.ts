import { privateRequest, Authentication } from '../common';
import { OrderDirection, OrderType, OrderTimeInForce, OrderStatus } from './types';

export interface AddOderParams {
  marketSymbol: string;
  direction: OrderDirection;
  type: OrderType;
  timeInForce: OrderTimeInForce;
  quantity?: number;
  ceiling?: number;
  limit?: number;
  expiresAt?: string;
  clientOrderId?: string;
}

export interface AddOrderResponse {
  id: string;
  marketSymbol: string;
  direction: OrderDirection;
  timeInForce: OrderTimeInForce;
  type: OrderType;
  quantity: number;
  fillQuantity: number;
  commission: number;
  proceeds: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string;
}

export const add = async (auth: Authentication, params: AddOderParams) => {
  const method = 'orders';
  const response = await privateRequest<AddOrderResponse>(method, auth, params);
  return response;
};
