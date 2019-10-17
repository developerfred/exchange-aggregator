import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';
import { TransactionReceipt } from 'web3-core';

export const enableTrading = async (environment: Environment): Promise<TransactionReceipt> => {
  log(`Enabling trading.`);

  return sendTransaction(environment, {
    contract: 'KyberReserve',
    method: 'enableTrade',
  });
};
