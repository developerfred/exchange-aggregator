import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const isEnabledToken = async (environment: Environment, token: string) => {
  const result = await makeCall<{
    0: boolean;
    1: boolean;
  }>(
    environment,
    {
      contract: 'ConversionRates',
      method: 'getTokenBasicData',
    },
    [token],
  );

  return result && result[1];
};
