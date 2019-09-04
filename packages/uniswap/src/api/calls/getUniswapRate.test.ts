import { getUniswapRate } from './getUniswapRate';
import { toWei } from 'web3-utils';
import { Environment } from '../../types';
import BigNumber from 'bignumber.js';

describe('getUniswapRate', () => {
  it('should properly handle the returned values', async () => {
    const contractFactoryMock = jest.fn();
    const getInputPriceMock = jest.fn();

    getInputPriceMock.mockImplementation((...args) => ({
      call: () => toWei('123'),
    }));

    contractFactoryMock.mockReturnValue({
      methods: {
        getInputPrice: getInputPriceMock,
      },
    });

    const env = ({
      contract: contractFactoryMock,
    } as any) as Environment;

    const result = await getUniswapRate(env, {
      makerAsset: '0x123',
      takerAsset: '0x456',
      nativeAsset: '0x789',
      takerDecimals: 18,
      takerQuantity: new BigNumber(10),
      targetExchange: '0x321',
    });

    expect(contractFactoryMock).toHaveBeenCalledWith('UniswapAdapter');
    expect(getInputPriceMock).toHaveBeenCalled();

    expect(result.toString()).toEqual('12.3');
  });
});
