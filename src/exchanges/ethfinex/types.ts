import { Options as BaseOptions } from '../../types';

export namespace Ethfinex {
  export interface Options extends BaseOptions {
    // Nothing to extend for now.
  }

  export interface WatchOptions extends Options {}

  export interface FetchOptions extends Options {}
}
