import { publicRequest } from '../common';

export interface GetOrderbookParams {
  market: string;
  depth?: 1 | 25 | 500;
}

export interface OrderbookEntry {
  quantity: number;
  rate: number;
}

export interface GetOrderbookResult {
  ask: OrderbookEntry[];
  bid: OrderbookEntry[];
}

export const orderbook = async (params: GetOrderbookParams) => {
  const query = {
    ...(params.depth && { depth: params.depth }),
  };

  const method = `markets/${params.market}/orderbook`;
  const response = await publicRequest<GetOrderbookResult>(method, query);
  return response;
};
