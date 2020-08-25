import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {
  allSchemaProperties,
  schemaRefOrVal,
  quotedString,
  alwaysValidSchema,
  loopPropertiesCode,
  orExpr,
} from "../util"
import {applySubschema, SubschemaApplication, Expr} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"

const error: KeywordErrorDefinition = {
  message: "should NOT have additional properties",
  params: ({params}) => `{additionalProperty: ${params.additionalProperty}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "additionalProperties",
  type: "object",
  schemaType: ["object", "boolean"],
  error,
  code(cxt) {
    const {gen, errorParams, schema, parentSchema, data, it} = cxt
    const {
      allErrors,
      usePattern,
      opts: {removeAdditional},
    } = it

    if ((schema === undefined || alwaysValidSchema(it, schema)) && removeAdditional !== "all") {
      return
    }

    const props = allSchemaProperties(parentSchema.properties)
    const patProps = allSchemaProperties(parentSchema.patternProperties)

    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)
    checkAdditionalProperties()
    if (!allErrors) gen.if(`${errsCount} === errors`)

    function checkAdditionalProperties(): void {
      loopPropertiesCode(cxt, (key: string) => {
        if (!props.length && !patProps.length) additionalPropertyCode(key)
        else gen.if(isAdditional(key), () => additionalPropertyCode(key))
      })
    }

    function isAdditional(key: string): string {
      let definedProp = ""
      if (props.length > 8) {
        // TODO maybe an option instead of hard-coded 8?
        const propsSchema = schemaRefOrVal(it, parentSchema.properties, "properties")
        definedProp = `${propsSchema}.hasOwnProperty(${key})`
      } else if (props.length) {
        definedProp = orExpr(props, (p) => `${key} === ${quotedString(p)}`)
      }
      if (patProps.length) {
        definedProp +=
          (definedProp ? " || " : "") + orExpr(patProps, (p) => `${usePattern(p)}.test(${key})`)
      }
      return `!(${definedProp})`
    }

    function deleteAdditional(key: string): void {
      gen.code(`delete ${data}[${key}];`)
    }

    function additionalPropertyCode(key: string): void {
      if (removeAdditional === "all" || (removeAdditional && schema === false)) {
        deleteAdditional(key)
        return
      }

      if (schema === false) {
        errorParams({additionalProperty: key})
        reportError(cxt, error)
        if (!allErrors) gen.code("break;")
        return
      }

      if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
        const valid = gen.name("valid")
        if (removeAdditional === "failing") {
          applyAdditionalSchema(key, valid, false)
          gen.if(`!${valid}`, () => {
            resetErrorsCount(gen, errsCount)
            deleteAdditional(key)
          })
        } else {
          applyAdditionalSchema(key, valid)
          if (!allErrors) gen.if(`!${valid}`, "break")
        }
      }
    }

    function applyAdditionalSchema(key: string, valid: string, errors?: false): void {
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
}

module.exports = def
