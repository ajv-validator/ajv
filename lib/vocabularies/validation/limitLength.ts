import {CodeKeywordDefinition} from "../../types"
import {concatSchema, dataNotType} from "../util"

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
    message({keyword, $data, schemaCode}) {
      const comp = keyword === "maxLength" ? "more" : "fewer"
      const sch = concatSchema(schemaCode, $data)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}

module.exports = def
