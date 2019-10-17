import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const isTradingEnabled = async (environment: Environment) => {
  return makeCall<boolean>(environment, {
    contract: 'KyberReserve',
    method: 'tradeEnabled',
  });
};
