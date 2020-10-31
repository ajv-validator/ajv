import type {CodeKeywordDefinition} from "../../types"
import KeywordCxt from "../../compile/context"
import {propertyInData, allSchemaProperties} from "../code"
import {alwaysValidSchema, toHash, mergeEvaluatedProps} from "../../compile/util"
import apDef from "./additionalProperties"

const def: CodeKeywordDefinition = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    const {gen, schema, parentSchema, data, it} = cxt
    if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
      apDef.code(new KeywordCxt(it, apDef, "additionalProperties"))
    }
    const allProps = allSchemaProperties(schema)
    if (it.opts.unevaluated && allProps.length && it.props !== true) {
      it.props = mergeEvaluatedProps(gen, toHash(allProps), it.props)
    }
    const properties = allProps.filter((p) => !alwaysValidSchema(it, schema[p]))
    if (properties.length === 0) return
    const valid = gen.name("valid")

    for (const prop of properties) {
      if (hasDefault(prop)) {
        applyPropertySchema(prop)
      } else {
        gen.if(propertyInData(data, prop, it.opts.ownProperties))
        applyPropertySchema(prop)
        if (!it.allErrors) gen.else().var(valid, true)
        gen.endIf()
      }
      cxt.ok(valid)
    }

    function hasDefault(prop: string): boolean | undefined {
      return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined
    }

    function applyPropertySchema(prop: string): void {
      cxt.subschema(
        {
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop,
          strictSchema: it.strictSchema,
        },
        valid
      )
    }
  },
}

export default def