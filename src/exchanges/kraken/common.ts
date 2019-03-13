import { Network } from '../../types';

export const getHttpPrefix = (network: Network) => {
  switch (network) {
    case Network.MAINNET:
      return 'https://api.kraken.com';
    default:
      throw new Error('Kraken only supports the MAINNET network.');
  }
};
