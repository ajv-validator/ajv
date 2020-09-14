import {CodeKeywordDefinition, SchemaObjCxt} from "../../types"
import KeywordCxt from "../../compile/context"
import {alwaysValidSchema, checkStrictMode} from "../util"
import {applySubschema} from "../../compile/subschema"
import {_, str, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: true,
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
      gen.ifNot(schValid, validateClause("else"))
    }

    cxt.pass(valid, () => cxt.error(true))

    function validateIf(): void {
      applySubschema(
        it,
        {
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false,
        },
        schValid
      )
    }

    function validateClause(keyword: string, ifClause?: Name): () => void {
      return () => {
        applySubschema(it, {keyword}, schValid)
        gen.assign(valid, schValid)
        if (ifClause) gen.assign(ifClause, _`${keyword}`)
        else cxt.setParams({ifClause: keyword})
      }
    }
  },
  error: {
    message: ({params}) => str`should match "${params.ifClause}" schema`,
    params: ({params}) => _`{failingKeyword: ${params.ifClause}}`,
  },
}

module.exports = def

function hasSchema(it: SchemaObjCxt, keyword: string): boolean {
  const schema = it.schema[keyword]
  return schema !== undefined && !alwaysValidSchema(it, schema)
}
