import {CodeKeywordDefinition, CompilationContext} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {_, str, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  implements: ["then", "else"],
  trackErrors: true,
  code(cxt: KeywordContext) {
    const {gen, it} = cxt
    const hasThen = hasSchema(it, "then")
    const hasElse = hasSchema(it, "else")
    if (!hasThen && !hasElse) {
      // TODO strict mode: fail or warning if both "then" and "else" are not present
      return
    }

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

function hasSchema(it: CompilationContext, keyword: string): boolean {
  const schema = it.schema[keyword]
  return schema !== undefined && !alwaysValidSchema(it, schema)
}
