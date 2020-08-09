const {concatSchema, dataNotType} = require("../compile/util")

const SCHEMA_TYPE = "number"

module.exports = {
  keywords: ["maxItems", "minItems"],
  type: "array",
  schemaType: SCHEMA_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const op = keyword == "maxItems" ? ">" : "<"
    const dnt = dataNotType($data, schemaCode, SCHEMA_TYPE)
    fail(dnt + `${data}.length` + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxItems" ? "more" : "fewer"
      const sch = concatSchema($data, schemaCode)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}
