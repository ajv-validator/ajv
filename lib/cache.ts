import SchemaObject from "./compile/schema_obj"

export default class Cache {
  _cache: {[key: string]: SchemaObject}

  constructor() {
    this._cache = {}
  }

  put(key: string, value: SchemaObject): void {
    this._cache[key] = value
  }

  get(key: string): SchemaObject {
    return this._cache[key]
  }

  del(key: string): void {
    delete this._cache[key]
  }

  clear(): void {
    this._cache = {}
  }
}
