export default class CodeGen {
  #names: {[key: string]: number} = {}
  // TODO make private. Possibly stack?
  _out = ""

  name(prefix: string): string {
    if (!this.#names[prefix]) this.#names[prefix] = 0
    const num = this.#names[prefix]++
    return `${prefix}_${num}`
  }

  code(str?: string): CodeGen {
    // TODO optionally strip whitespace
    if (str) this._out += str + "\n"
    return this
  }
}
