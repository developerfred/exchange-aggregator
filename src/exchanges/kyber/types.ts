import { Options as BaseOptions } from '../../types';
import { Environment } from '@melonproject/protocol';

export namespace Kyber {
  export interface Options extends BaseOptions {
    environment: Environment;
    quantities?: number[];
    interval?: number;
  }

  export interface WatchOptions extends Options {}

  export interface FetchOptions extends Options {}
}
