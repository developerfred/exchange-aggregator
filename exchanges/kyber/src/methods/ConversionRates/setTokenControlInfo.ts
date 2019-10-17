import BigNumber from 'bignumber.js';
import { Environment } from '../..';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';
import { TransactionReceipt } from 'web3-core';

export interface TokenControlInfo {
  minimalRecordResolution: BigNumber;
  maxPerBlockImbalance: BigNumber;
  maxTotalImbalance: BigNumber;
}

export const setTokenControlInfo = async (
  environment: Environment,
  token: string,
  values: TokenControlInfo,
): Promise<TransactionReceipt> => {
  log(`Setting token control info for ${token}.`);

  const args = [
    token,
    values.minimalRecordResolution.toFixed(),
    values.maxPerBlockImbalance.toFixed(),
    values.maxTotalImbalance.toFixed(),
  ];

  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'setTokenControlInfo',
    },
    undefined,
    args,
  );
};
