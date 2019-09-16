import { publicRequest } from '../common';
import { OrderBookResponse } from '../types';

export interface OrderBookParams {
  instrument_code: string;
  level?: number;
}

export const orderBook = async (params: OrderBookParams): Promise<OrderBookResponse> => {
  const endpoint = `order-book/${params.instrument_code}`;
  delete params['instrument_code'];

  const response = (await publicRequest('get', endpoint, params)).data;
  console.log(response);
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as OrderBookResponse;
};
