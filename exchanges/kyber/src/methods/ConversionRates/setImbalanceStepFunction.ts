import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';
import { StepFunctionData } from './setQtyStepFunction';
import { TransactionReceipt } from 'web3-core';

export const setImbalanceStepFunction = async (
  environment: Environment,
  token: string,
  data: StepFunctionData,
): Promise<TransactionReceipt> => {
  log(`Setting imbalance step function for ${token}.`);

  const xBuy = data.xBuy.map(item => item.toFixed());
  const yBuy = data.yBuy.map(item => item.toFixed());
  const xSell = data.xSell.map(item => item.toFixed());
  const ySell = data.ySell.map(item => item.toFixed());

  const args = [token, xBuy, yBuy, xSell, ySell];
  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'setImbalanceStepFunction',
    },
    undefined,
    args,
  );
};
