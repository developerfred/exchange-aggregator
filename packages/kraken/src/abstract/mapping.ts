import { AssetPair } from '@melonproject/ea-common';

const mapping = {
  BTC: 'XBT',
} as { [key: string]: string };

export const fromStandardSymbol = (symbol: string) => {
  return mapping[symbol] || symbol;
};

export const fromStandarPair = (pair: AssetPair) => {
  const base = fromStandardSymbol(pair.base.symbol);
  const quote = fromStandardSymbol(pair.quote.symbol);
  return `${base}/${quote}`;
};
