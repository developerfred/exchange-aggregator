import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getReserveAddress = async (environment: Environment): Promise<string> => {
  return makeCall<string>(environment, {
    contract: 'ConversionRates',
    method: 'reserveContract',
  });
};
