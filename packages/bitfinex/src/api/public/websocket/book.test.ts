import { book } from './book';
import { log } from '../../../debug';

it('asd', async () => {
  book({ symbol: 'tBTCUSD' }).subscribe(log);
  book({ symbol: 'tBTCUSD' }).subscribe(log);

  return new Promise(resolve => {
    setTimeout(() => resolve(), 10000);
  });
});
