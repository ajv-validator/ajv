import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode, it: {opts}}) {
    const op = keyword === "maxLength" ? ">" : "<"
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const len = opts.unicode === false ? `${data}.length` : `ucs2length(${data})`
    fail(dnt + len + op + schemaCode)
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
