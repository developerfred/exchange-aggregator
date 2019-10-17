import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getListedTokens = async (environment: Environment) => {
  const result = await makeCall<string[]>(environment, {
    contract: 'ConversionRates',
    method: 'getListedTokens',
  });

  return result || [];
};
