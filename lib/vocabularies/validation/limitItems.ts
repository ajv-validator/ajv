import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const op = keyword === "maxItems" ? ">" : "<"
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    fail(dnt + `${data}.length` + op + schemaCode)
  },
  error: {
    message({keyword, schemaCode}) {
      const comp = keyword === "maxItems" ? "more" : "fewer"
      return str`should NOT have ${comp} than ${schemaCode} items`
    },
    params: ({schemaCode}) => _`{limit: ${schemaCode}}`,
  },
}

module.exports = def
