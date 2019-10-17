import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';
import { KyberContractAddresses } from './setContractAddresses';

const config = (method: string) => ({
  contract: 'KyberReserve',
  method,
});

export const getContractAddresses = async (env: Environment): Promise<KyberContractAddresses> => {
  const [kyberNetwork, conversionRates, sanityRates] = await Promise.all([
    makeCall<string>(env, config('kyberNetwork')),
    makeCall<string>(env, config('conversionRatesContract')),
    makeCall<string>(env, config('sanityRatesContract')),
  ]);

  return {
    kyberNetwork,
    conversionRates,
    sanityRates: sanityRates || '0x0000000000000000000000000000000000000000',
  };
};
