import axios from 'axios';
import qs from 'qs';
import { getHttpPrefix, generateSignature } from '../common';
import { Network } from '../../../types';
import { Kraken } from '../types';

export const cancel = async (
  txid: string,
  network: Network,
  options: Kraken.TradeOptions,
) => {
  const path = '/0/private/CancelOrder';
  const url = `${getHttpPrefix(network)}${path}`;
  const nonce = !!options.nonce ? options.nonce : Date.now() * 1000;

  const data = qs.stringify({
    nonce,
    txid,
  });

  const key = options.auth.key;
  const secret = options.auth.secret;
  const signature = generateSignature(data, path, secret, nonce);
  return axios.post(url, data, {
    headers: {
      'API-Key': key,
      'API-Sign': signature,
    },
  });
};
