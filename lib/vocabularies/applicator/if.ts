import {CodeKeywordDefinition, KeywordErrorDefinition, CompilationContext} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"
import {_, str, Name} from "../../compile/codegen"

const error: KeywordErrorDefinition = {
  message: ({params}) => str`should match "${params.ifClause}" schema`,
  params: ({params}) => _`{failingKeyword: ${params.ifClause}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  // TODO
  // implements: ["then", "else"],
  code(cxt) {
    const {gen, pass, errorParams, it} = cxt
    const hasThen = hasSchema(it, "then")
    const hasElse = hasSchema(it, "else")
    if (!hasThen && !hasElse) {
      // TODO strict mode: fail or warning if both "then" and "else" are not present
      return
    }

    const valid = gen.let("valid", true)
    const errsCount = gen.const("_errs", "errors")
    const schValid = gen.name("_valid")

    validateIf()
    resetErrorsCount(gen, errsCount)

    if (hasThen && hasElse) {
      const ifClause = gen.let("ifClause")
      errorParams({ifClause})
      gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause))
    } else if (hasThen) {
      gen.if(schValid, validateClause("then"))
    } else {
      gen.if(`!${schValid}`, validateClause("else"))
    }

    pass(valid, () => reportExtraError(cxt, error))

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
        gen.code(`${valid} = ${schValid};`)
        if (ifClause) gen.code(`${ifClause} = "${keyword}";`)
        else errorParams({ifClause: keyword})
      }
    }
  },
  error,
}

module.exports = def

function hasSchema(it: CompilationContext, keyword: string): boolean {
  const schema = it.schema[keyword]
  return schema !== undefined && !alwaysValidSchema(it, schema)
}
