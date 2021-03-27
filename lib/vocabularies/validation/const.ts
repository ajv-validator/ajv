import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_} from "../../compile/codegen"
import {useFunc} from "../../compile/util"
import equal from "../../runtime/equal"

export type ConstError = ErrorObject<"const", {allowedValue: any}>

const error: KeywordErrorDefinition = {
  message: "must be equal to constant",
  params: ({schemaCode}) => _`{allowedValue: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "const",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, data, schemaCode} = cxt
    // TODO optimize for scalar values in schema
    cxt.fail$data(_`!${useFunc(gen, equal)}(${data}, ${schemaCode})`)
  },
}

export default def
