import { AssetPair } from '@melonproject/ea-common';

const mapping = {
  BTC: 'XBT',
} as { [key: string]: string };

const swapKv = (object: typeof mapping) => {
  const keys = Object.keys(object);
  return Object.values(object).reduce(
    (carry, current, index) => ({
      ...carry,
      [current]: keys[index],
    }),
    {},
  );
};

const inverted = swapKv(mapping) as { [key: string]: string };

export const fromStandardSymbol = (symbol: string) => {
  return mapping[symbol] || symbol;
};

export const toStandardSymbol = (symbol: string) => {
  return inverted[symbol] || symbol;
};

export const fromStandarPair = (pair: AssetPair) => {
  const base = fromStandardSymbol(pair.base);
  const quote = fromStandardSymbol(pair.quote);
  return `${base}/${quote}`;
};

export const toStandardPair = (pair: string): AssetPair => {
  const [base, quote] = pair.split('/', 2).map(symbol => {
    return toStandardSymbol(symbol);
  });

  return { base, quote };
};
