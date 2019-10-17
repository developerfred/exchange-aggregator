import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const setReserveAddress = async (environment: Environment, address: string): Promise<TransactionReceipt> => {
  log(`Setting reserve address to ${address}.`);

  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'setReserveAddress',
    },
    undefined,
    [address],
  );
};
