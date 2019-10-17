import { Contract } from 'web3-eth-contract';
import { Environment, Deployment } from '..';

const contractAddress = (environment: Environment, name: string) => {
  if (environment.deployment && environment.deployment[name as keyof Deployment]) {
    return environment.deployment[name as keyof Deployment];
  }

  throw new Error(`Missing address for ${name} in deployment.`);
};

const loadContract = (environment: Environment, name: string, address: string) => {
  try {
    const abi = require(`../contracts/${name}.abi.json`);
    return new environment.client.Contract(abi, address);
  } catch (e) {
    throw new Error(`Failed to load contract ${name}: ${e.toString()}`);
  }
};

const contracts = new Map<string, Contract>();
export const getContract = (environment: Environment, name: string, address?: string) => {
  const resolvedAddress = address || contractAddress(environment, name);
  const key = `${name}:${resolvedAddress}`;
  if (!contracts.has(key)) {
    contracts.set(key, loadContract(environment, name, resolvedAddress));
  }

  return contracts.get(key);
};
