import { publicRequest } from '../common';

export interface GetOrderbookParams {
  market: string;
  type: 'sell' | 'buy' | 'both';
}

export type GetOrderbookResult = {
  Quantity: number;
  Rate: number;
}[];

export const orderbook = async (params: GetOrderbookParams) => {
  const method = 'public/getorderbook';
  const response = await publicRequest<GetOrderbookResult>(method, params);
  if (!response.success) {
    throw new Error(response.message);
  }

  return response.result;
};
