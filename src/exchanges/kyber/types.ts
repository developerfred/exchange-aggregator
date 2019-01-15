import { Options as BaseOptions } from '../../types';

export namespace Kyber {
  export interface Options extends BaseOptions {
    quantities?: number[];
  }

  export interface WatchOptions extends Options {}

  export interface FetchOptions extends Options {}
}
