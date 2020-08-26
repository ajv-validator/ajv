import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema, loopPropertiesCode} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError} from "../../compile/errors"
import {str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  code(cxt) {
    const {gen, ok, errorParams, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const valid = gen.name("valid")

    loopPropertiesCode(cxt, (key) => {
      errorParams({propertyName: key})
      applySubschema(
        it,
        {keyword: "propertyNames", data: key, propertyName: key, compositeRule: true},
        valid
      )
      gen.if(`!${valid}`, () => {
        reportExtraError(cxt, def.error as KeywordErrorDefinition)
        if (!it.allErrors) gen.break()
      })
    })

    ok(valid)
  },
  error: {
    message: ({params}) => str`property name '${params.propertyName}' is invalid`, // TODO double quotes?
    params: ({params}) => `{propertyName: ${params.propertyName}}`,
  },
}

module.exports = def
