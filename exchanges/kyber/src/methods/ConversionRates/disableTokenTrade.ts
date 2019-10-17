import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const disableTokenTrade = async (environment: Environment, token: string): Promise<TransactionReceipt> => {
  log(`Disabling trading for ${token}.`);

  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'disableTokenTrade',
    },
    undefined,
    [token],
  );
};
