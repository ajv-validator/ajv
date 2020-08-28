import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {
  allSchemaProperties,
  schemaRefOrVal,
  alwaysValidSchema,
  loopPropertiesCode,
  orExpr,
} from "../util"
import {applySubschema, SubschemaApplication, Expr} from "../../compile/subschema"
import {_, Name, Expression} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "additionalProperties",
  type: "object",
  schemaType: ["object", "boolean", "undefined"], // "undefined" is needed to support option removeAdditional: "all"
  trackErrors: true,
  code(cxt: KeywordContext) {
    const {gen, schema, parentSchema, data, errsCount, it} = cxt
    const {allErrors, usePattern, opts} = it

    if (alwaysValidSchema(it, schema) && opts.removeAdditional !== "all") return

    const props = allSchemaProperties(parentSchema.properties)
    const patProps = allSchemaProperties(parentSchema.patternProperties)

    // const errsCount = gen.const("_errs", N.errors)
    checkAdditionalProperties()
    if (!allErrors) gen.if(`${errsCount} === ${N.errors}`)

    function checkAdditionalProperties(): void {
      loopPropertiesCode(cxt, (key: Name) => {
        if (!props.length && !patProps.length) additionalPropertyCode(key)
        else gen.if(isAdditional(key), () => additionalPropertyCode(key))
      })
    }

    function isAdditional(key: Name): string {
      let definedProp: Expression = ""
      if (props.length > 8) {
        // TODO maybe an option instead of hard-coded 8?
        const propsSchema = schemaRefOrVal(it, parentSchema.properties, "properties")
        definedProp = `${propsSchema}.hasOwnProperty(${key})`
      } else if (props.length) {
        definedProp = orExpr(props, (p) => _`${key} === ${p}`)
      }
      if (patProps.length) {
        definedProp +=
          (definedProp ? " || " : "") + orExpr(patProps, (p) => `${usePattern(p)}.test(${key})`)
      }
      return `!(${definedProp})`
    }

    function deleteAdditional(key: Name): void {
      gen.code(`delete ${data}[${key}];`)
    }

    function additionalPropertyCode(key: Name): void {
      if (opts.removeAdditional === "all" || (opts.removeAdditional && schema === false)) {
        deleteAdditional(key)
        return
      }

      if (schema === false) {
        cxt.setParams({additionalProperty: key})
        cxt.error()
        if (!allErrors) gen.break()
        return
      }

      if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
        const valid = gen.name("valid")
        if (opts.removeAdditional === "failing") {
          applyAdditionalSchema(key, valid, false)
          gen.ifNot(valid, () => {
            cxt.reset()
            deleteAdditional(key)
          })
        } else {
          applyAdditionalSchema(key, valid)
          if (!allErrors) gen.ifNot(valid, "break")
        }
      }
    }

    function applyAdditionalSchema(key: Name, valid: Name, errors?: false): void {
      const subschema: SubschemaApplication = {
        keyword: "additionalProperties",
        dataProp: key,
        expr: Expr.Str,
      }
      if (errors === false) {
        Object.assign(subschema, {
          compositeRule: true,
          createErrors: false,
          allErrors: false,
        })
      }
      applySubschema(it, subschema, valid)
    }
  },
  error: {
    message: "should NOT have additional properties",
    params: ({params}) => _`{additionalProperty: ${params.additionalProperty}}`,
  },
}

module.exports = def

export default def
