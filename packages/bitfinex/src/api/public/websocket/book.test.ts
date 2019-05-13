import { pair } from './book';
import { log } from '../../../debug';

it('asd', async () => {
  pair('MLN/ETH').subscribe(value => {
    console.log(value);
  });

  return new Promise(resolve => {
    setTimeout(() => resolve(), 1000);
  });
});
