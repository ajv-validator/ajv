import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../../compile/util"
import {validateArray} from "../code"
import {_, and, nil} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullable} from "./nullable"

const def: CodeKeywordDefinition = {
  keyword: "elements",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const [valid, cond] = checkNullable(cxt, nil)
    gen.if(and(cond, _`Array.isArray(${data})`), () => gen.assign(valid, validateArray(cxt)))
    cxt.pass(valid)
  },
}

export default def
