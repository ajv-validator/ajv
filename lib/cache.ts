import {SchemaEnv} from "./compile"
import {CacheInterface} from "./types"

export default class Cache implements CacheInterface {
  _cache: {[key: string]: SchemaEnv}

  constructor() {
    this._cache = {}
  }

  put(key: string, value: SchemaEnv): void {
    this._cache[key] = value
  }

  get(key: string): SchemaEnv {
    return this._cache[key]
  }

  del(key: string): void {
    delete this._cache[key]
  }

  clear(): void {
    this._cache = {}
  }
}
