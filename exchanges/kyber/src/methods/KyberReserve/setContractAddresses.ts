import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { log } from '../../debug';

export interface KyberContractAddresses {
  kyberNetwork: string;
  conversionRates: string;
  sanityRates?: string;
}

export const setContractAddresses = async (
  environment: Environment,
  addresses: KyberContractAddresses,
): Promise<TransactionReceipt> => {
  log('Referencing contract addresses in KyberReserve contract.');

  return sendTransaction(
    environment,
    {
      contract: 'KyberReserve',
      method: 'setContracts',
    },
    undefined,
    [
      addresses.kyberNetwork,
      addresses.conversionRates,
      addresses.sanityRates || '0x0000000000000000000000000000000000000000',
    ],
  );
};
