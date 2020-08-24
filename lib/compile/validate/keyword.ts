import {
  KeywordDefinition,
  KeywordErrorDefinition,
  KeywordContext,
  MacroKeywordDefinition,
  CompiledKeywordDefinition,
  ValidatedKeywordDefinition,
  CompilationContext,
  KeywordCompilationResult,
} from "../../types"
import {applySubschema} from "../subschema"
import {reportExtraError} from "../errors"

const keywordError: KeywordErrorDefinition = {
  message: ({keyword}) => `'should pass "${keyword}" keyword validation'`,
  params: ({keyword}) => `{keyword: "${keyword}"}`, // TODO possibly remove it as keyword is reported in the object
}

export default function keywordCode(
  cxt: KeywordContext,
  ruleType: string,
  def: KeywordDefinition
): void {
  if ("macro" in def) macroKeywordCode(cxt, def)
  else if ("compile" in def) compiledKeywordCode(cxt, ruleType, def)
  else if ("validate" in def) validatedKeywordCode(cxt, ruleType, def)
}

function macroKeywordCode(cxt: KeywordContext, def: MacroKeywordDefinition) {
  const {gen, keyword, schema, parentSchema, it} = cxt
  const macroSchema = def.macro.call(it.self, schema, parentSchema, it)
  const schemaRef = addCustomRule(it, keyword, macroSchema)
  if (it.opts.validateSchema !== false) it.self.validateSchema(macroSchema, true)

  const valid = gen.name("valid")
  applySubschema(
    it,
    {
      schema: macroSchema,
      schemaPath: "",
      topSchemaRef: schemaRef,
      compositeRule: true,
    },
    valid
  )

  // TODO refactor ifs
  gen.code(`if (!${valid}) {`)
  reportExtraError(cxt, keywordError)
  gen.code(it.allErrors ? "}" : "} else {")
}

function compiledKeywordCode(
  _cxt: KeywordContext,
  _ruleType: string,
  _def: CompiledKeywordDefinition
) {}

function validatedKeywordCode(
  _cxt: KeywordContext,
  _ruleType: string,
  _def: ValidatedKeywordDefinition
) {}

export function validateKeywordSchema(
  it: CompilationContext,
  keyword: string,
  def: KeywordDefinition
): void {
  const deps = def.dependencies
  if (deps?.some((kwd) => !Object.prototype.hasOwnProperty.call(it.schema, kwd))) {
    throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`)
  }

  if (def.validateSchema) {
    const valid = def.validateSchema(it.schema[keyword])
    if (!valid) {
      const msg = "keyword schema is invalid: " + it.self.errorsText(def.validateSchema.errors)
      if (it.opts.validateSchema === "log") it.logger.error(msg)
      else throw new Error(msg)
    }
  }
}

function addCustomRule(
  it: CompilationContext,
  keyword: string,
  res: KeywordCompilationResult
): string {
  if (res === undefined) throw new Error(`custom keyword "${keyword}" failed to compile`)
  const idx = it.customRules.length
  it.customRules[idx] = res
  return `customRule${idx}`
}
