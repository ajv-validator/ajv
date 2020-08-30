import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {bad$DataType, or} from "../util"
import {_, str, operators} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordContext) {
    const {keyword, data, $data, schemaCode, it} = cxt
    const op = keyword === "maxLength" ? operators.GT : operators.LT
    const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
    const len = it.opts.unicode === false ? _`${data}.length` : _`ucs2length(${data})`
    cxt.fail(or(bdt, _`${len} ${op} ${schemaCode}`))
  },
  error: {
    message({keyword, schemaCode}) {
      const comp = keyword === "maxLength" ? "more" : "fewer"
      return str`should NOT have ${comp} than ${schemaCode} items`
    },
    params: ({schemaCode}) => _`{limit: ${schemaCode}}`,
  },
}

module.exports = def
