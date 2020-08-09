import {concatSchema, dataNotType} from "../util"

const SCH_TYPE = "number"

module.exports = {
  keywords: ["maxLength", "minLength"],
  type: "string",
  schemaType: SCH_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode, opts}) {
    const op = keyword == "maxLength" ? ">" : "<"
    const dnt = dataNotType(schemaCode, SCH_TYPE, $data)
    const len =
      opts.unicode === false ? `${data}.length` : `ucs2length(${data})`
    fail(dnt + len + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxLength" ? "more" : "fewer"
      const sch = concatSchema(schemaCode, $data)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}
