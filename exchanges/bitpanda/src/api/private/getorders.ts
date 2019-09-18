import { privateRequest } from '../common';
import { Authentication, GetOrdersResponse } from '../types';
// TODO: TO TEST
export const getorders = async (auth: Authentication): Promise<GetOrdersResponse> => {
  const response = (await privateRequest('get', `account/orders`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as GetOrdersResponse;
};
