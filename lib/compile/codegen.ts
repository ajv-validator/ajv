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

  if(condition: string): CodeGen {
    this.#blocks.push(Block.If)
    this.code(`if(${condition}){`)
    return this
  }

  elseIf(condition: string): CodeGen {
    if (this._block !== Block.If) throw new Error('CodeGen: "else if" without "if"')
    this.code(`}else if(${condition}){`)
    return this
  }

  else(): CodeGen {
    if (this._block !== Block.If) throw new Error('CodeGen: "else" without "if"')
    this._block = Block.Else
    this.code(`}else{`)
    return this
  }

  endIf(): CodeGen {
    const b = this._block
    if (b !== Block.If && b !== Block.Else) throw new Error('CodeGen: "endIf" without "if"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  for(iteration: string): CodeGen {
    this.#blocks.push(Block.For)
    this.code(`for(${iteration}){`)
    return this
  }

  endFor(): CodeGen {
    const b = this._block
    if (b !== Block.For) throw new Error('CodeGen: "endFor" without "for"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  startBlock(): CodeGen {
    this.#blockStarts.push(this.#blocks.length)
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

  get _block(): Block {
    const len = this.#blocks.length
    if (len === 0) throw new Error("CodeGen: not in block")
    return this.#blocks[len - 1]
  }

  set _block(b: Block) {
    const len = this.#blocks.length
    if (len === 0) throw new Error('CodeGen: not in "if" block')
    this.#blocks[len - 1] = b
  }
}
