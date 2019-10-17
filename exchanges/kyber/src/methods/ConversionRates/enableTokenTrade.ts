import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { TransactionReceipt } from 'web3-core';
import { log } from '../../debug';

export const enableTokenTrade = async (environment: Environment, token: string): Promise<TransactionReceipt> => {
  log(`Enabling trading for ${token}.`);

  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'enableTokenTrade',
    },
    undefined,
    [token],
  );
};
