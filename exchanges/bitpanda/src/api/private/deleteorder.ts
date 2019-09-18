import { privateRequest } from '../common';
import { Authentication } from '../types';

// TODO: TO TEST
export const deleteorder = async (auth: Authentication, order_id: string): Promise<any> => {
  const response = (await privateRequest('delete', `account/orders/${order_id}`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
