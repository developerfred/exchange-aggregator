import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export const setValidRateDuration = async (environmnet: Environment, blocks: number): Promise<TransactionReceipt> => {
  log(`Setting valid rate duration to ${blocks} blocks.`);

  return sendTransaction(
    environmnet,
    {
      contract: 'ConversionRates',
      method: 'setValidRateDurationInBlocks',
    },
    undefined,
    [blocks],
  );
};
