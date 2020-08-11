import {KeywordDefinition} from "../../types"
import {concatSchema, dataNotType} from "../util"

const def: KeywordDefinition = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const op = keyword == "maxProperties" ? ">" : "<"
    const dnt = dataNotType(schemaCode, def.schemaType, $data)
    fail(dnt + `Object.keys(${data}).length` + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxProperties" ? "more" : "fewer"
      const sch = concatSchema(schemaCode, $data)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}

module.exports = def
