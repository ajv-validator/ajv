import {KeywordDefinition} from "../../types"
import {schemaProperties, propertyInData} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(cxt) {
    const {gen, ok, schema, data, it} = cxt
    const properties = schemaProperties(it, schema)
    if (properties.length === 0) {
      ok()
      return
    }

    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)

    gen.block(validateProperties)

    // TODO refactor ifs
    if (!it.allErrors) gen.code(`if (${errsCount} === errors) {`)

    function validateProperties() {
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop)
        } else {
          gen.if(propertyInData(data, prop, Expr.Const, it.opts.ownProperties))
          applyPropertySchema(prop)
          if (!it.allErrors) gen.else().code(`${valid} = true;`)
          gen.endIf()
        }
        if (!it.allErrors) gen.if(valid)
      }
    }

    function hasDefault(prop: string): boolean | undefined {
      return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined
    }

    function applyPropertySchema(prop: string) {
      applySubschema(
        it,
        {
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop,
          expr: Expr.Const,
        },
        valid
      )
    }
  },
}

module.exports = def
