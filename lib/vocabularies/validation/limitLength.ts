import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordContext) {
    const {keyword, data, $data, schemaCode, it} = cxt
    const op = keyword === "maxLength" ? ">" : "<"
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const len = it.opts.unicode === false ? `${data}.length` : `ucs2length(${data})`
    cxt.fail(dnt + len + op + schemaCode)
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
