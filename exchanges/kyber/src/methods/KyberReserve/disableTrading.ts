import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const disableTrading = async (environment: Environment): Promise<TransactionReceipt> => {
  log(`Disabling trading.`);

  return sendTransaction(environment, {
    contract: 'KyberReserve',
    method: 'disableTrade',
  });
};
