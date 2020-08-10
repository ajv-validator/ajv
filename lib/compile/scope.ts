export default class Scope {
  _names: {[key: string]: number}

  constructor() {
    this._names = {}
  }

  getName(prefix: string): string {
    if (!this._names[prefix]) this._names[prefix] = 0
    const num = this._names[prefix]++
    return `${prefix}_${num}`
  }
}
