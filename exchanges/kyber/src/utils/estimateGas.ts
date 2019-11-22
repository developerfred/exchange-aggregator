import axios from 'axios';
import { ContractSendMethod } from 'web3-eth-contract';
import { toWei } from 'web3-utils';
import { Environment } from '../';

export const estimateGas = async (environment: Environment, method: ContractSendMethod, account?: string) => {
  const latestBlock = await environment.client.getBlock('latest');
  const estimation = await method.estimateGas(account && { from: account || environment.account });
  return Math.min(estimation * 1.1, latestBlock.gasLimit);
};

export async function getGasPrice(maxWait: number) {
  try {
    const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    const data = response.data.gasPriceRange;
    const price = Object.keys(data).find(price => parseFloat(data[price]) <= maxWait);
    return toWei(`${(price || response.data.fast) / 10}`, 'gwei');
  } catch (error) {
    throw new Error(`Failed to fetch gas price data: ${error}`);
  }
}
