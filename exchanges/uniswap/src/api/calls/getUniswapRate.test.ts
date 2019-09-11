import { getUniswapRate } from './getUniswapRate';
import { toWei } from 'web3-utils';
import { Environment } from '../../types';
import BigNumber from 'bignumber.js';
import { Token } from '@melonproject/ea-common';

describe('getUniswapRate', () => {
  it('should properly handle the returned values', async () => {
    const contractFactoryMock = jest.fn();
    const getInputRateMock = jest.fn();

    getInputRateMock.mockImplementation((...args) => ({
      call: () => toWei('123'),
    }));

    contractFactoryMock.mockReturnValue({
      methods: {
        getInputRate: getInputRateMock,
      },
    });

    const env = ({
      contract: contractFactoryMock,
    } as any) as Environment;

    const makerAsset: Token = {
      address: '0x123',
      decimals: 18,
      symbol: 'ABC',
    };

    const takerAsset: Token = {
      address: '0x456',
      decimals: 18,
      symbol: 'XYZ',
    };

    const result = await getUniswapRate(env, {
      makerAsset,
      takerAsset,
      nativeAsset: takerAsset,
      takerQuantity: new BigNumber(10),
      targetExchange: '0x321',
    });

    expect(contractFactoryMock).toHaveBeenCalledWith('UniswapAdapter');
    expect(getInputRateMock).toHaveBeenCalled();
    expect(result.toString()).toEqual('123');
  });
});
