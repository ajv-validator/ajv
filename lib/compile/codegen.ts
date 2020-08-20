enum Block {
  If,
  Else,
  For,
}

export default class CodeGen {
  #names: {[key: string]: number} = {}
  // TODO make private. Possibly stack?
  _out = ""
  #blocks: Block[] = []
  #blockStarts: number[] = []

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

  if(condition: string, thenBody?: () => void, elseBody?: () => void): CodeGen {
    this.#blocks.push(Block.If)
    this.code(`if(${condition}){`)
    if (thenBody && elseBody) {
      thenBody()
      this.else()
      elseBody()
      this.endIf()
    } else if (thenBody) {
      thenBody()
      this.endIf()
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
    const b = this._lastBlock
    if (b !== Block.If && b !== Block.Else) throw new Error('CodeGen: "endIf" without "if"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  for(iteration: string, forBody?: () => void): CodeGen {
    this.#blocks.push(Block.For)
    this.code(`for(${iteration}){`)
    if (forBody) {
      forBody()
      this.endFor()
    }
    return this
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== Block.For) throw new Error('CodeGen: "endFor" without "for"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  block(body?: () => void, expectedToClose?: number): CodeGen {
    this.#blockStarts.push(this.#blocks.length)
    if (body) {
      body()
      this.endBlock(expectedToClose)
    }
    return this
  }

  endBlock(expectedToClose?: number): CodeGen {
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

  get _lastBlock(): Block {
    const len = this.#blocks.length
    if (len === 0) throw new Error("CodeGen: not in block")
    return this.#blocks[len - 1]
  }

  set _lastBlock(b: Block) {
    const len = this.#blocks.length
    if (len === 0) throw new Error('CodeGen: not in "if" block')
    this.#blocks[len - 1] = b
  }
}
