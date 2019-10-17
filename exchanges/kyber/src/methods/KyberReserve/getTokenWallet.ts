import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getTokenWallet = async (environment: Environment, token: string) => {
  return makeCall<string>(
    environment,
    {
      contract: 'KyberReserve',
      method: 'tokenWallet',
    },
    [token],
  );
};
