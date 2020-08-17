import {KeywordDefinition} from "../../types"
import {concatSchema, dataNotType} from "../util"

const def: KeywordDefinition = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const op = keyword == "maxItems" ? ">" : "<"
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    fail(dnt + `${data}.length` + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxItems" ? "more" : "fewer"
      const sch = concatSchema(schemaCode, $data)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}

module.exports = def
