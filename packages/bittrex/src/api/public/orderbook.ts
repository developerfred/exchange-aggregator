import { publicRequest } from '../common';

export interface GetOrderbookParams {
  market: string;
  type: 'sell' | 'buy' | 'both';
}

export interface OrderbookEntry {
  Quantity: number;
  Rate: number;
}

export interface FullOrderbook {
  buy: OrderbookEntry[];
  sell: OrderbookEntry[];
}

export type GetOrderbookResult = FullOrderbook | OrderbookEntry[];

export const orderbook = async (params: GetOrderbookParams) => {
  const method = 'public/getorderbook';
  const response = await publicRequest<GetOrderbookResult>(method, params);
  if (!response.success) {
    throw new Error(response.message);
  }

  return response.result;
};
