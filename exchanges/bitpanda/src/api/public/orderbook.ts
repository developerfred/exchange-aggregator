import { publicRequest } from '../common';
import { OrderBookResponse, OrderBookParams } from '../types';

export const orderbook = async (params: OrderBookParams): Promise<OrderBookResponse> => {
  const endpoint = `order-book/${params.instrument_code}`;
  delete params['instrument_code'];

  const response = (await publicRequest('get', endpoint, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderBookResponse;
};
