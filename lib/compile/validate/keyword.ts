import {
  KeywordDefinition,
  KeywordErrorDefinition,
  KeywordContext,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  CompilationContext,
  KeywordCompilationResult,
} from "../../types"
import {applySubschema} from "../subschema"
import {reportError, reportExtraError, extendErrors} from "../errors"
import {getParentData, callValidate} from "../../vocabularies/util"
import {Name, Expression} from "../codegen"

export const keywordError: KeywordErrorDefinition = {
  message: ({keyword}) => `'should pass "${keyword}" keyword validation'`,
  params: ({keyword}) => `{keyword: "${keyword}"}`, // TODO possibly remove it as keyword is reported in the object
}

export default function keywordCode(
  cxt: KeywordContext,
  _ruleType: string,
  def: KeywordDefinition
): void {
  // TODO "code" keyword
  // TODO refactor
  if (cxt.$data && "validate" in def) {
    funcKeywordCode(cxt, def as FuncKeywordDefinition)
  } else if ("macro" in def) {
    macroKeywordCode(cxt, def)
  } else if ("compile" in def || "validate" in def) {
    funcKeywordCode(cxt, def)
  }
}

function macroKeywordCode(cxt: KeywordContext, def: MacroKeywordDefinition) {
  const {gen, fail, keyword, schema, parentSchema, it} = cxt
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

  fail(`!${valid}`, () => reportExtraError(cxt, keywordError))
}

function funcKeywordCode(cxt: KeywordContext, def: FuncKeywordDefinition) {
  const {gen, ok, fail, keyword, schema, schemaCode, parentSchema, $data, it} = cxt
  checkAsync(it, def)
  const validate =
    "compile" in def && !$data ? def.compile.call(it.self, schema, parentSchema, it) : def.validate
  const validateRef = addCustomRule(it, keyword, validate)
  const valid = gen.name("valid")
  gen.code(`let ${valid};`)

  if (def.errors === false) {
    validateNoErrorsRule()
  } else {
    validateRuleWithErrors()
  }

  function validateNoErrorsRule(): void {
    gen.block(() => {
      if ($data) check$data()
      assignValid()
      if (def.modifying) modifyData(cxt)
    })
    if (!def.valid) fail(`!${valid}`)
  }

  function validateRuleWithErrors(): void {
    gen.block()
    if ($data) check$data()
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)
    const ruleErrs = def.async ? validateAsyncRule() : validateSyncRule()
    if (def.modifying) modifyData(cxt)
    gen.endBlock()
    reportKeywordErrors(ruleErrs, errsCount)
  }

  function check$data(): void {
    gen
      // TODO add support for schemaType in keyword definition
      // .if(`${dataNotType(schemaCode, <string>def.schemaType, $data)} false`) // TODO refactor
      .if(`${schemaCode} === undefined`)
      .code(`${valid} = true;`)
      .else()
    if (def.validateSchema) {
      const validateSchemaRef = addCustomRule(it, keyword, def.validateSchema)
      gen.code(`${valid} = ${validateSchemaRef}(${schemaCode});`)
      // TODO fail if schema fails validation
      // gen.if(`!${valid}`)
      // reportError(cxt, keywordError)
      // gen.else()
      gen.if(valid)
    }
  }

  function validateAsyncRule(): Name {
    const ruleErrs = gen.name("ruleErrs")
    gen.code(`let ${ruleErrs} = null;`)
    gen.try(
      () => assignValid("await "),
      (e) =>
        gen
          .code(`${valid} = false;`)
          .if(`${e} instanceof ValidationError`, `${ruleErrs} = ${e}.errors;`, `throw ${e};`)
    )
    return ruleErrs
  }

  function validateSyncRule(): string {
    const validateErrs = `${validateRef}.errors`
    gen.code(`${validateErrs} = null;`)
    assignValid("")
    return validateErrs
  }

  function assignValid(await: string = def.async ? "await " : ""): void {
    const passCxt = it.opts.passContext ? "this" : "self"
    const passSchema = !(("compile" in def && !$data) || def.schema === false)
    gen.code(`${valid} = ${await}${callValidate(cxt, validateRef, passCxt, passSchema)};`)
  }

  function reportKeywordErrors(ruleErrs: Expression, errsCount: Name): void {
    switch (def.valid) {
      case true:
        return
      case false:
        addKeywordErrors(cxt, ruleErrs, errsCount)
        return ok("false") // TODO maybe add gen.skip() to remove code till the end of the block?
      default:
        fail(`!${valid}`, () => addKeywordErrors(cxt, ruleErrs, errsCount))
    }
  }
}

function modifyData(cxt: KeywordContext) {
  const {gen, data, it} = cxt
  const parent = getParentData(it)
  gen.if(parent.data, `${data} = ${parent.data}[${parent.property}];`)
}

function addKeywordErrors(cxt: KeywordContext, ruleErrs: Expression, errsCount: Name): void {
  const {gen} = cxt
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

function checkAsync(it: CompilationContext, def: FuncKeywordDefinition) {
  if (def.async && !it.async) throw new Error("async keyword in sync schema")
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
  res?: KeywordCompilationResult
): string {
  if (res === undefined) throw new Error(`custom keyword "${keyword}" failed to compile`)
  const idx = it.customRules.length
  it.customRules[idx] = res
  return `customRule${idx}`
}
