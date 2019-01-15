import { Options as BaseOptions } from '../../types';

export namespace Kraken {
  export interface Options extends BaseOptions {
    interval?: number;
  }

  export interface WatchOptions extends Options {}

  export interface FetchOptions extends Options {}
}
