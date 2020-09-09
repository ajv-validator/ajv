import {CodeKeywordDefinition} from "../../types"
import KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  code(cxt: KeywordCxt) {
    const {gen, schema, data, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const valid = gen.name("valid")

    gen.forIn("key", data, (key) => {
      cxt.setParams({propertyName: key})
      applySubschema(
        it,
        {keyword: "propertyNames", data: key, propertyName: key, compositeRule: true},
        valid
      )
      gen.ifNot(valid, () => {
        cxt.error(true)
        if (!it.allErrors) gen.break()
      })
    })

    cxt.ok(valid)
  },
  error: {
    message: ({params}) => str`property name '${params.propertyName}' is invalid`, // TODO double quotes?
    params: ({params}) => _`{propertyName: ${params.propertyName}}`,
  },
}

module.exports = def
