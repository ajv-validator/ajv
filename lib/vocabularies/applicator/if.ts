import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type {SchemaObjCxt} from "../../compile"
import type KeywordCxt from "../../compile/context"
import {_, str, not, Name} from "../../compile/codegen"
import {
  alwaysValidSchema,
  mergeEvaluatedPropsToName,
  mergeEvaluatedItemsToName,
} from "../../compile/util"
import {checkStrictMode} from "../../compile/validate"

export type IfKeywordError = ErrorObject<"if", {failingKeyword: string}>

const error: KeywordErrorDefinition = {
  message: ({params}) => str`should match "${params.ifClause}" schema`,
  params: ({params}) => _`{failingKeyword: ${params.ifClause}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, parentSchema, it} = cxt
    if (parentSchema.then === undefined && parentSchema.else === undefined) {
      checkStrictMode(it, '"if" without "then" and "else" is ignored')
    }
    const hasThen = hasSchema(it, "then")
    const hasElse = hasSchema(it, "else")
    if (!hasThen && !hasElse) return

    const valid = gen.let("valid", true)
    const schValid = gen.name("_valid")
    validateIf()
    cxt.reset()

    if (hasThen && hasElse) {
      const ifClause = gen.let("ifClause")
      cxt.setParams({ifClause})
      gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause))
    } else if (hasThen) {
      gen.if(schValid, validateClause("then"))
    } else {
      gen.if(not(schValid), validateClause("else"))
    }

    cxt.pass(valid, () => cxt.error(true))

    function validateIf(): void {
      const schCxt = cxt.subschema(
        {
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false,
        },
        schValid
      )
      cxt.mergeEvaluated(schCxt)
    }

    function validateClause(keyword: string, ifClause?: Name): () => void {
      return () => {
        const schCxt = cxt.subschema({keyword}, schValid)
        gen.assign(valid, schValid)
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => {
            if (schCxt.props !== undefined && it.props !== true) {
              it.props = mergeEvaluatedPropsToName(gen, schCxt.props, it.props)
            }
            if (schCxt.items !== undefined && it.items !== true) {
              it.items = mergeEvaluatedItemsToName(gen, schCxt.items, it.items)
            }
          })
        }
        if (ifClause) gen.assign(ifClause, _`${keyword}`)
        else cxt.setParams({ifClause: keyword})
      }
    }
  },
}

function hasSchema(it: SchemaObjCxt, keyword: string): boolean {
  const schema = it.schema[keyword]
  return schema !== undefined && !alwaysValidSchema(it, schema)
}

export default def
