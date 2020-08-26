enum Block {
  If,
  Else,
  For,
  Func,
}

export type Code = string | (() => void)

export default class CodeGen {
  #names: {[key: string]: number} = {}
  // TODO make private. Possibly stack?
  _out = ""
  #blocks: Block[] = []
  #blockStarts: number[] = []

  toString(): string {
    return this._out
  }

  name(prefix: string): string {
    if (!this.#names[prefix]) this.#names[prefix] = 0
    const num = this.#names[prefix]++
    return `${prefix}_${num}`
  }

  code(c?: Code): CodeGen {
    // TODO optionally strip whitespace
    if (typeof c == "function") c()
    else if (c) this._out += c + "\n"
    return this
  }

  if(condition: string, thenBody?: Code, elseBody?: Code): CodeGen {
    this.#blocks.push(Block.If)
    this.code(`if(${condition}){`)
    if (thenBody && elseBody) {
      this.code(thenBody).else().code(elseBody).endIf()
    } else if (thenBody) {
      this.code(thenBody).endIf()
    } else if (elseBody) {
      throw new Error("CodeGen: else body without then body")
    }
    return this
  }

  elseIf(condition: string): CodeGen {
    if (this._lastBlock !== Block.If) throw new Error('CodeGen: "else if" without "if"')
    this.code(`}else if(${condition}){`)
    return this
  }

  else(): CodeGen {
    if (this._lastBlock !== Block.If) throw new Error('CodeGen: "else" without "if"')
    this._lastBlock = Block.Else
    this.code(`}else{`)
    return this
  }

  endIf(): CodeGen {
    // TODO possibly remove empty branches here
    const b = this._lastBlock
    if (b !== Block.If && b !== Block.Else) throw new Error('CodeGen: "endIf" without "if"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  for(iteration: string, forBody?: Code): CodeGen {
    this.#blocks.push(Block.For)
    this.code(`for(${iteration}){`)
    if (forBody) this.code(forBody).endFor()
    return this
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== Block.For) throw new Error('CodeGen: "endFor" without "for"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  try(tryBody: Code, catchCode?: (e: string) => void, finallyCode?: Code): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    this.code("try{").code(tryBody)
    if (catchCode) {
      const err = this.name("e")
      this.code(`}catch(${err}){`)
      catchCode(err)
    }
    if (finallyCode) this.code("}finally{").code(finallyCode)
    this.code("}")
    return this
  }

  block(body?: Code, expectedToClose?: number): CodeGen {
    this.#blockStarts.push(this.#blocks.length)
    if (body) this.code(body).endBlock(expectedToClose)
    return this
  }

  endBlock(expectedToClose?: number): CodeGen {
    // TODO maybe close blocks one by one, eliminating empty branches
    const len = this.#blockStarts.pop()
    if (len === undefined) throw new Error("CodeGen: not in block sequence")
    const toClose = this.#blocks.length - len
    if (toClose < 0 || (expectedToClose !== undefined && toClose !== expectedToClose)) {
      throw new Error("CodeGen: block sequence already ended or incorrect number of blocks")
    }
    this.#blocks.length = len
    if (toClose > 0) this.code("}".repeat(toClose))
    return this
  }

  func(name = "", args = "", async?: boolean, funcBody?: Code): CodeGen {
    this.#blocks.push(Block.Func)
    this.code(`${async ? "async " : ""}function ${name}(${args}){`)
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  endFunc(): CodeGen {
    const b = this._lastBlock
    if (b !== Block.Func) throw new Error('CodeGen: "endFunc" without "func"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  get _lastBlock(): Block {
    return this.#blocks[this._last()]
  }

  set _lastBlock(b: Block) {
    this.#blocks[this._last()] = b
  }

  _last(): number {
    const len = this.#blocks.length
    if (len === 0) throw new Error("CodeGen: not in block")
    return len - 1
  }
}
