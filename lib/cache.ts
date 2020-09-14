import {SchemaEnv} from "./compile"
import {CacheInterface} from "./types"

export default class Cache implements CacheInterface {
  private _cache: {[key: string]: SchemaEnv | undefined}

  constructor() {
    this._cache = {}
  }

  put(key: string, value: SchemaEnv): void {
    this._cache[key] = value
  }

  get(key: string): SchemaEnv | undefined {
    return this._cache[key]
  }

  del(key: string): void {
    delete this._cache[key]
  }

  clear(): void {
    this._cache = {}
  }
}
