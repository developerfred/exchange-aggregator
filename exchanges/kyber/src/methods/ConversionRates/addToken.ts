import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const addToken = async (environment: Environment, token: string): Promise<TransactionReceipt> => {
  log(`Adding ${token} token.`);

  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'addToken',
    },
    undefined,
    [token],
  );
};
