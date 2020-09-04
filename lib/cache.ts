import StoredSchema from "./compile/stored_schema"
import {CacheInterface} from "./types"

export default class Cache implements CacheInterface {
  _cache: {[key: string]: StoredSchema}

  constructor() {
    this._cache = {}
  }

  put(key: string, value: StoredSchema): void {
    this._cache[key] = value
  }

  get(key: string): StoredSchema {
    return this._cache[key]
  }

  del(key: string): void {
    delete this._cache[key]
  }

  clear(): void {
    this._cache = {}
  }
}
