import axios, { Method } from 'axios';
import { Authentication } from './types';

const prefix = 'https://api.exchange.bitpanda.com';
const version = 'v1';

export const publicRequest = async (method: string, endpoint: string, params: any = {}, data: any = {}) => {
  const url = `${prefix}/public/${version}/${endpoint}`;
  return request(method, url, {}, params, data);
};

export const privateRequest = async (
  method: string,
  endpoint: string,
  auth: Authentication,
  params: any = {},
  data: any = {},
) => {
  const url = `${prefix}/public/${version}/${endpoint}`;
  const headers = { Authorization: `Bearer ${auth.apiKey}` };
  return request(method, url, headers, params, data);
};

export const request = async (method: string, url: string, headers: any = {}, params: any = {}, data: any = {}) => {
  try {
    return axios({
      url: url,
      method: method as Method,
      params: params,
      data: data,
      headers: headers,
    });
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};
