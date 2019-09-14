import { SymbolAssetPair } from '@melonproject/ea-common';

const mapping = {
  BTC: 'XBT',
} as { [key: string]: string };

export const fromStandardSymbol = (symbol: string) => {
  return mapping[symbol] || symbol;
};

export const fromStandarPair = (pair: SymbolAssetPair) => {
  const base = fromStandardSymbol(pair.base as string);
  const quote = fromStandardSymbol(pair.quote as string);
  return `${base}/${quote}`;
};
