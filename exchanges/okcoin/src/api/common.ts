import axios, { Method } from 'axios';
import * as crypto from 'crypto';
import { Authentication, CallLimit } from './types';

const prefix = 'https://www.okcoin.com';

// const errorsHttp = {
//   '400': 'Bad Request — Invalid request format',
//   '401': 'Unauthorized — Invalid API Key',
//   '403': 'Forbidden — You do not have access to the requested resource',
//   '404': 'Not Found',
//   '429': 'Too Many Requests',
//   '500': 'Internal Server Error — We had a problem with our server',
// };

const signature = (auth: Authentication, timestamp: string, method: string, requestedPath: string, data?: string) => {
  const preHash = `${timestamp}${method.toUpperCase()}${requestedPath}${data || ''}`;
  const hmac = crypto.createHmac('sha256', auth.secret);
  const signature = hmac.update(preHash, 'utf8').digest('base64');
  return signature;
};

export const apiRequest = async (
  auth: Authentication,
  limit: CallLimit,
  method: string,
  endpoint: string,
  params?: any,
  data?: any,
) => {
  const requestedPath = params ? `${endpoint}${JSON.stringify(params)}` : `${endpoint}`;
  const url = `${prefix}${requestedPath}`;
  const timestamp = new Date().toISOString();

  const headers = {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': auth.key,
    'OK-ACCESS-PASSPHRASE': auth.passphrase,
    'OK-ACCESS-SIGN': signature(auth, timestamp, method, requestedPath, JSON.stringify(data)),
    'OK-ACCESS-TIMESTAMP': timestamp,
  };
  return request(method, url, headers, params, data);
};

export const request = async (method: string, url: string, headers: any = {}, params: any = {}, data: any = {}) => {
  console.log(method);
  console.log(url);
  console.log(headers);
  console.log(params);
  console.log(data);

  return axios({
    url: url,
    method: method as Method,
    params: params,
    data: data,
    headers: headers,
  })
    .catch(e => {
      const error = new Error(`${e.response.data['message']} (${e.response.data['code']})`);
      (error as any).original = e;
      throw error;
    })
    .then(value => {
      console.log('return value');
      console.log(value);
      return value.data;
    });
  // .finally()

  // return response as AxiosResponse<any>

  // try {
  //   return axios({
  //     url: url,
  //     method: method as Method,
  //     params: params,
  //     data: data,
  //     headers: headers,
  //   });
  // } catch (e) {
  //   const error = new Error(`${e.response.data['message']} (${e.response.data['code']})`);
  //   (error as any).original = e;
  //   throw error;
  // }
};
