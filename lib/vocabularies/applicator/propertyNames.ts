import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema, loopPropertiesCode} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  code(cxt) {
    const {gen, ok, errorParams, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return ok()

    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)

    loopPropertiesCode(cxt, (key) => {
      errorParams({propertyName: key})
      applySubschema(
        it,
        {keyword: "propertyNames", data: key, propertyName: key, compositeRule: true},
        valid
      )
      gen.if(`!${valid}`, () => {
        reportExtraError(cxt, def.error as KeywordErrorDefinition)
        if (!it.allErrors) gen.code("break;")
      })
    })

    // TODO refactor ifs
    if (!it.allErrors) gen.code(`if (${errsCount} === errors) {`)
  },
  error: {
    message: ({params}) => `"property name '" + ${params.propertyName} + "' is invalid"`,
    params: ({params}) => `{propertyName: ${params.propertyName}}`,
  },
}

module.exports = def
