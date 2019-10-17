import BigNumber from 'bignumber.js';
import { Environment } from '../../';
import { log } from '../../debug';
import { sendTransaction } from '../../utils/sendTransaction';
import { TransactionReceipt } from 'web3-core';

export interface StepFunctionData {
  xBuy: BigNumber[];
  yBuy: BigNumber[];
  xSell: BigNumber[];
  ySell: BigNumber[];
}

export const setQtyStepFunction = async (
  environment: Environment,
  token: string,
  data: StepFunctionData,
): Promise<TransactionReceipt> => {
  log(`Setting quantity step function for ${token}.`);

  const xBuy = data.xBuy.map(item => item.toFixed());
  const yBuy = data.yBuy.map(item => item.toFixed());
  const xSell = data.xSell.map(item => item.toFixed());
  const ySell = data.ySell.map(item => item.toFixed());

  const args = [token, xBuy, yBuy, xSell, ySell];
  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'setQtyStepFunction',
    },
    undefined,
    args,
  );
};
