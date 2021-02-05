import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../../compile/util"
import {validateArray} from "../code"
import {_, not, and, Code} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "elements",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    const {gen, data, schema, parentSchema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const valid = gen.name("valid")
    let cond: Code = _`Array.isArray(${data})`
    if (parentSchema.nullable) {
      gen.let(valid, _`${data} === null`)
      cond = and(not(valid), cond)
    } else {
      gen.let(valid, false)
    }
    gen.if(cond, () => gen.assign(valid, validateArray(cxt)))
    cxt.pass(valid)
  },
}

export default def
