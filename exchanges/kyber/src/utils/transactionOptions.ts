import { ContractSendMethod, SendOptions } from 'web3-eth-contract';
import { Environment } from '../';
import { estimateGas, getGasPrice } from './estimateGas';

export const transactionOptions = async (
  environment: Environment,
  transaction: ContractSendMethod,
  account?: string,
) => {
  const gasPrice = await getGasPrice(1);
  const gas = await estimateGas(environment, transaction, account);

  return {
    ...(account && { from: account }),
    gas,
    gasPrice,
  } as SendOptions;
};
