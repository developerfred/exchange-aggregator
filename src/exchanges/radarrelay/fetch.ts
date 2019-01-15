import { RadarRelay } from './types';
import { fetchRadarBook, normalizeOrder } from './common';

export const fetch = async (options: RadarRelay.FetchOptions) => {
  const response = await fetchRadarBook(options);

  return [].concat(
    response.asks.map(order => normalizeOrder(options, order)),
    response.bids.map(order => normalizeOrder(options, order)),
  );
};
