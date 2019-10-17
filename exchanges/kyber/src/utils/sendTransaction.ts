import { TransactionReceipt } from 'web3-core';
import { ContractSendMethod, Contract, SendOptions } from 'web3-eth-contract';
import { Environment } from '../';
import { getContract } from './getContract';
import { transactionOptions } from './transactionOptions';

interface TransactionConfig {
  contract: Contract | string;
  method: string;
  address?: string;
  account?: string;
}

export const sendTransaction = async (
  environment: Environment,
  config: TransactionConfig,
  options?: SendOptions,
  args?: any[],
): Promise<TransactionReceipt> => {
  // const name = typeof config.contract === 'string' ? config.contract : (config.contract as Contract).address;
  // console.log('');
  // console.log(`Calling ${config.method}() on ${name}`);
  // console.log('=========================================');

  const instance =
    typeof config.contract === 'string' ? getContract(environment, config.contract, config.address) : config.contract;

  const transaction = instance.methods[config.method](...(args || [])) as ContractSendMethod;
  const opts = options || (await transactionOptions(environment, transaction, config.account || environment.account));

  const receipt = await new Promise<TransactionReceipt>((resolve, reject) => {
    const send = transaction.send(opts);
    send.once('receipt', receipt => resolve(receipt)).catch(error => reject(error));
  });

  // console.log(`Transaction: ${receipt.transactionHash}`);
  // console.log(`From: ${receipt.from}`);
  // console.log(`To: ${receipt.to}`);
  // console.log(`Gas used: ${receipt.gasUsed}`);
  // console.log(`Block: ${receipt.blockNumber}`);
  // console.log('=========================================');
  // console.log('');

  return receipt;
};
