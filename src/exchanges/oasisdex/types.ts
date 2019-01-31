import { Options as BaseOptions } from '../../types';
import { Environment } from '@melonproject/protocol';

export namespace OasisDex {
  export interface Options extends BaseOptions {
    environment: Environment;
  }

  export interface WatchOptions extends Options {
    interval?: number;
  }

  export interface FetchOptions extends Options {}
}
