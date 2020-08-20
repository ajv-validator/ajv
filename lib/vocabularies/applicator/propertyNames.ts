import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  code(cxt) {
    const {gen, ok, errorParams, schema, data, it} = cxt
    if (alwaysValidSchema(it, schema)) {
      ok()
      return
    }

    const valid = gen.name("valid")
    const key = gen.name("key")
    const errsCount = gen.name("_errs")
    errorParams({propertyName: key})
    gen.code(`const ${errsCount} = errors;`)

    // TODO maybe always iterate own properties in v7?
    const iteration = it.opts.ownProperties ? `of Object.keys(${data})` : `in ${data}`
    gen.for(`const ${key} ${iteration}`, () => {
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
