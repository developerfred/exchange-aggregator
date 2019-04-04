import mapping from './mapping.json';

type AnyKv = { [key: string]: string };

const swapKv = (object: AnyKv): AnyKv => {
  const keys = Object.keys(object);
  return Object.values(object).reduce(
    (carry, current, index) => ({
      ...carry,
      [current]: keys[index],
    }),
    {},
  );
};

const inverted = swapKv(mapping);

export const fromStandardSymbol = (symbol: string) => {
  return (mapping as AnyKv)[symbol] || symbol;
};

export const toStandardSymbol = (symbol: string) => {
  return inverted[symbol] || symbol;
};

export const fromStandarPair = (pair: string) => {
  return pair
    .split('/', 2)
    .map(symbol => {
      return fromStandardSymbol(symbol);
    })
    .join('/');
};

export const toStandardPair = (pair: string) => {
  return pair
    .split('/', 2)
    .map(symbol => {
      return toStandardSymbol(symbol);
    })
    .join('/');
};
