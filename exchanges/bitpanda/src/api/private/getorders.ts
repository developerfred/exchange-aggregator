import { privateRequest } from '../common';
import { Authentication, getOrdersResponse } from '../types';

export const getorders = async (auth: Authentication): Promise<getOrdersResponse> => {
  const response = (await privateRequest('get', `account/orders`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as getOrdersResponse;
};
