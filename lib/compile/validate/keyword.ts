import {
  KeywordDefinition,
  KeywordErrorDefinition,
  KeywordContext,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  // CompiledKeywordDefinition,
  // ValidatedKeywordDefinition,
  CompilationContext,
  KeywordCompilationResult,
} from "../../types"
import {applySubschema} from "../subschema"
import {reportError, reportExtraError, extendErrors} from "../errors"
import {getParentData} from "../../vocabularies/util"

export const keywordError: KeywordErrorDefinition = {
  message: ({keyword}) => `'should pass "${keyword}" keyword validation'`,
  params: ({keyword}) => `{keyword: "${keyword}"}`, // TODO possibly remove it as keyword is reported in the object
}

export default function keywordCode(
  cxt: KeywordContext,
  ruleType: string,
  def: KeywordDefinition
): void {
  const {it} = cxt
  if ("macro" in def) {
    macroKeywordCode(cxt, def)
  } else if ("compile" in def || "validate" in def) {
    // TODO "code" keyword
    checkAsync(it, def)
    funcKeywordCode(cxt, ruleType, def)
  }
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
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
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

function checkAsync(it: CompilationContext, def: FuncKeywordDefinition) {
  if (def.async && !it.async) throw new Error("async keyword in sync schema")
}

function funcKeywordCode(cxt: KeywordContext, _ruleType: string, def: FuncKeywordDefinition) {
  const {gen, ok, fail, keyword, schema, schemaValue, parentSchema, data, it} = cxt
  const validate =
    "compile" in def ? def.compile.call(it.self, schema, parentSchema, it) : def.validate
  const validateRef = addCustomRule(it, keyword, validate)
  const errsCount = gen.name("_errs")
  const valid = gen.name("valid")
  gen.code(`const ${errsCount} = errors;`)
  if (def.errors === false) {
    validateNoErrorsRule()
  } else {
    if (def.async) validateAsyncRule()
    else validateRule()
  }

  function validateNoErrorsRule() {
    gen.code(`let ${valid} = ${def.async ? "await " : ""}${callValidate(validateRef)};`)
    if (def.modifying) modifyData()
    if (def.valid) return ok()
    fail(`!${valid}`)
  }

  function validateAsyncRule() {
    const ruleErrs = gen.name("ruleErrs")
    gen
      .code(
        `let ${ruleErrs} = null
        let ${valid};`
      )
      .try(`${valid} = await ${callValidate(validateRef)};`, (e) =>
        gen
          .code(`${valid} = false;`)
          .if(`${e} instanceof ValidationError`, `${ruleErrs} = ${e}.errors;`, `throw ${e};`)
      )
    if (def.modifying) modifyData()
    reportKeywordErrors(ruleErrs)
  }

  function validateRule() {
    const validateErrs = `${validateRef}.errors`
    gen.code(
      `${validateErrs} = null;
      let ${valid} = ${callValidate(validateRef)};`
    )
    if (def.modifying) modifyData()
    reportKeywordErrors(validateErrs)
  }

  // TODO refactor with ref?
  function callValidate(v: string): string {
    const {errorPath} = it
    const context = it.opts.passContext ? "this" : "self"
    const dataAndSchema =
      "compile" in def || def.schema === false // TODO $data?
        ? `${data}`
        : `${schemaValue}, ${data}, ${it.topSchemaRef}${it.schemaPath}`
    const dataPath = `(dataPath || '')${errorPath === '""' ? "" : ` + ${errorPath}`}` // TODO joinPaths?
    const parent = getParentData(it)
    return `${v}.call(${context}, ${dataAndSchema}, ${dataPath}, ${parent.data}, ${parent.property}, rootData)`
  }

  function modifyData() {
    const parent = getParentData(it)
    gen.if(parent.data, `${data} = ${parent.data}[${parent.property}];`)
  }

  function reportKeywordErrors(ruleErrs: string): void {
    switch (def.valid) {
      case true:
        return ok()
      case false:
        addKeywordErrors(ruleErrs)
        return ok("false")
      default:
        // TODO refactor ifs
        gen.code(`if (!${valid}) {`)
        addKeywordErrors(ruleErrs)
        gen.code(`}`)
        if (!it.allErrors) gen.code(" else {")
    }
  }

  function addKeywordErrors(ruleErrs: string): void {
    gen.if(
      `Array.isArray(${ruleErrs})`,
      () => {
        gen
          .if("vErrors === null", `vErrors = ${ruleErrs}`, `vErrors = vErrors.concat(${ruleErrs})`)
          .code("errors = vErrors.length;")
        extendErrors(cxt, errsCount)
      },
      () => reportError(cxt, keywordError)
    )
  }
}

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
