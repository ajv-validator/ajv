import {
  KeywordDefinition,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  CompilationContext,
  KeywordCompilationResult,
} from "../../types"
import KeywordContext from "../context"
import {applySubschema} from "../subschema"
import {extendErrors} from "../errors"
import {checkDataTypes, DataType} from "../util"
import {callValidateCode} from "../../vocabularies/util"
import CodeGen, {_, nil, or, Code, Name} from "../codegen"
import N from "../names"

export function keywordCode(
  it: CompilationContext,
  keyword: string,
  def: KeywordDefinition,
  ruleType?: string
): void {
  const cxt = new KeywordContext(it, def, keyword)
  if ("code" in def) {
    def.code(cxt, ruleType)
  } else if (cxt.$data && "validate" in def) {
    funcKeywordCode(cxt, def as FuncKeywordDefinition)
  } else if ("macro" in def) {
    macroKeywordCode(cxt, def)
  } else if ("compile" in def || "validate" in def) {
    funcKeywordCode(cxt, def)
  }
}

function macroKeywordCode(cxt: KeywordContext, def: MacroKeywordDefinition) {
  const {gen, keyword, schema, parentSchema, it} = cxt
  const macroSchema = def.macro.call(it.self, schema, parentSchema, it)
  const schemaRef = useKeyword(gen, keyword, macroSchema)
  if (it.opts.validateSchema !== false) it.self.validateSchema(macroSchema, true)

  const valid = gen.name("valid")
  applySubschema(
    it,
    {
      schema: macroSchema,
      schemaPath: nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true,
    },
    valid
  )
  cxt.pass(valid, () => cxt.error(true))
}

function funcKeywordCode(cxt: KeywordContext, def: FuncKeywordDefinition) {
  const {gen, keyword, schema, schemaCode, schemaType, parentSchema, $data, it} = cxt
  checkAsync(it, def)
  const validate =
    "compile" in def && !$data ? def.compile.call(it.self, schema, parentSchema, it) : def.validate
  const validateRef = useKeyword(gen, keyword, validate)
  const valid = gen.let("valid")

  gen.block(def.errors === false ? validateNoErrorsRule : validateRuleWithErrors)
  cxt.ok(def.valid ?? valid)

  function validateNoErrorsRule(): void {
    if ($data) check$data()
    assignValid()
    if (def.modifying) modifyData(cxt)
    reportKeywordErrors(() => cxt.error())
  }

  function validateRuleWithErrors(): void {
    if ($data) check$data()
    const ruleErrs = def.async ? validateAsyncRule() : validateSyncRule()
    if (def.modifying) modifyData(cxt)
    reportKeywordErrors(() => addKeywordErrors(cxt, ruleErrs))
  }

  function check$data(): void {
    gen.if(_`${schemaCode} === undefined`).assign(valid, true)
    if (schemaType || def.validateSchema) {
      gen.elseIf(or(wrong$DataType(), invalid$DataSchema()))
      cxt.$dataError()
      gen.assign(valid, false)
    }
    gen.else()
  }

  function wrong$DataType(): Code {
    if (schemaType) {
      if (!(schemaCode instanceof Name)) throw new Error("ajv implementation error")
      const st = Array.isArray(schemaType) ? schemaType : [schemaType]
      return _`(${checkDataTypes(st, schemaCode, it.opts.strictNumbers, DataType.Wrong)})`
    }
    return nil
  }

  function invalid$DataSchema(): Code {
    if (def.validateSchema) {
      const validateSchemaRef = useKeyword(gen, keyword, def.validateSchema)
      return _`!${validateSchemaRef}(${schemaCode})`
    }
    return nil
  }

  function validateAsyncRule(): Name {
    const ruleErrs = gen.let("ruleErrs", null)
    gen.try(
      () => assignValid(_`await `),
      (e) =>
        gen.assign(valid, false).if(
          _`${e} instanceof ValidationError`,
          () => gen.assign(ruleErrs, _`${e}.errors`),
          () => gen.throw(e)
        )
    )
    return ruleErrs
  }

  function validateSyncRule(): Code {
    const validateErrs = _`${validateRef}.errors`
    gen.assign(validateErrs, null)
    assignValid(nil)
    return validateErrs
  }

  function assignValid(await: Code = def.async ? _`await ` : nil): void {
    const passCxt = it.opts.passContext ? N.this : N.self
    const passSchema = !(("compile" in def && !$data) || def.schema === false)
    gen.assign(valid, _`${await}${callValidateCode(cxt, validateRef, passCxt, passSchema)}`)
  }

  // TODO maybe refactor to gen.ifNot(def.valid ?? valid, repErrs) once dead branches are removed
  function reportKeywordErrors(repErrs: () => void): void {
    if (def.valid === false) repErrs()
    else if (def.valid !== true) gen.ifNot(valid, repErrs)
  }
}

function modifyData(cxt: KeywordContext) {
  const {gen, data, it} = cxt
  gen.if(it.parentData, () => gen.assign(data, _`${it.parentData}[${it.parentDataProperty}]`))
}

function addKeywordErrors(cxt: KeywordContext, errs: Code): void {
  const {gen} = cxt
  gen.if(
    _`Array.isArray(${errs})`,
    () => {
      gen
        .assign(N.vErrors, _`${N.vErrors} === null ? ${errs} : ${N.vErrors}.concat(${errs})`)
        .assign(N.errors, _`${N.vErrors}.length`)
      extendErrors(cxt)
    },
    () => cxt.error()
  )
}

function checkAsync(it: CompilationContext, def: FuncKeywordDefinition) {
  if (def.async && !it.async) throw new Error("async keyword in sync schema")
}

function useKeyword(gen: CodeGen, keyword: string, result?: KeywordCompilationResult): Name {
  if (result === undefined) throw new Error(`keyword "${keyword}" failed to compile`)
  return gen.value("keyword", {ref: result}) // TODO value.code
}
