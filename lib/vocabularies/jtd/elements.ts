import type {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../../compile/util"
import {validateArray} from "../code"
import {_, not, nil} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullable} from "./nullable"

const error: KeywordErrorDefinition = {
  message: ({parentSchema}) => (parentSchema?.nullable ? "must be array or null" : "must be array"),
  params: ({parentSchema}) => _`{nullable: ${!!parentSchema?.nullable}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "elements",
  schemaType: "object",
  error,
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const [valid] = checkNullable(cxt, nil)
    gen.if(not(valid), () =>
      gen.if(
        _`Array.isArray(${data})`,
        () => gen.assign(valid, validateArray(cxt)),
        () => cxt.error()
      )
    )
    cxt.ok(valid)
  },
}

export default def
