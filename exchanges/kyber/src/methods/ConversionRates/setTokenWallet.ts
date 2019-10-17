import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const setTokenWallet = async (
  environment: Environment,
  token: string,
  wallet: string,
): Promise<TransactionReceipt> => {
  log(`Setting wallet of ${token} to ${wallet}.`);

  return sendTransaction(
    environment,
    {
      contract: 'KyberReserve',
      method: 'setTokenWallet',
    },
    undefined,
    [token, wallet],
  );
};
