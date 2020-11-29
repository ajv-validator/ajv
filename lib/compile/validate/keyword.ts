import type {
  AddedKeywordDefinition,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  AnySchema,
  SchemaValidateFunction,
  AnyValidateFunction,
} from "../../types"
import type {SchemaObjCxt} from ".."
import type {JSONType} from "../rules"
import KeywordCxt from "../context"
import {extendErrors} from "../errors"
import {callValidateCode} from "../../vocabularies/code"
import {CodeGen, _, nil, not, stringify, Code, Name} from "../codegen"
import N from "../names"

type KeywordCompilationResult = AnySchema | SchemaValidateFunction | AnyValidateFunction

export function keywordCode(
  it: SchemaObjCxt,
  keyword: string,
  def: AddedKeywordDefinition,
  ruleType?: JSONType
): void {
  const cxt = new KeywordCxt(it, def, keyword)
  if ("code" in def) {
    def.code(cxt, ruleType)
  } else if (cxt.$data && def.validate) {
    funcKeywordCode(cxt, def)
  } else if ("macro" in def) {
    macroKeywordCode(cxt, def)
  } else if (def.compile || def.validate) {
    funcKeywordCode(cxt, def)
  }
}

function macroKeywordCode(cxt: KeywordCxt, def: MacroKeywordDefinition): void {
  const {gen, keyword, schema, parentSchema, it} = cxt
  const macroSchema = def.macro.call(it.self, schema, parentSchema, it)
  const schemaRef = useKeyword(gen, keyword, macroSchema)
  if (it.opts.validateSchema !== false) it.self.validateSchema(macroSchema, true)

  const valid = gen.name("valid")
  cxt.subschema(
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

function funcKeywordCode(cxt: KeywordCxt, def: FuncKeywordDefinition): void {
  const {gen, keyword, schema, parentSchema, $data, it} = cxt
  checkAsync(it, def)
  const validate =
    !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate
  const validateRef = useKeyword(gen, keyword, validate)
  const valid = gen.let("valid")
  cxt.block$data(valid, validateKeyword)
  cxt.ok(def.valid ?? valid)

  function validateKeyword(): void {
    if (def.errors === false) {
      assignValid()
      if (def.modifying) modifyData(cxt)
      reportErrs(() => cxt.error())
    } else {
      const ruleErrs = def.async ? validateAsync() : validateSync()
      if (def.modifying) modifyData(cxt)
      reportErrs(() => addErrs(cxt, ruleErrs))
    }
  }

  function validateAsync(): Name {
    const ruleErrs = gen.let("ruleErrs", null)
    gen.try(
      () => assignValid(_`await `),
      (e) =>
        gen.assign(valid, false).if(
          _`${e} instanceof ${it.ValidationError as Name}`,
          () => gen.assign(ruleErrs, _`${e}.errors`),
          () => gen.throw(e)
        )
    )
    return ruleErrs
  }

  function validateSync(): Code {
    const validateErrs = _`${validateRef}.errors`
    gen.assign(validateErrs, null)
    assignValid(nil)
    return validateErrs
  }

  function assignValid(_await: Code = def.async ? _`await ` : nil): void {
    const passCxt = it.opts.passContext ? N.this : N.self
    const passSchema = !(("compile" in def && !$data) || def.schema === false)
    gen.assign(
      valid,
      _`${_await}${callValidateCode(cxt, validateRef, passCxt, passSchema)}`,
      def.modifying
    )
  }

  function reportErrs(errors: () => void): void {
    gen.if(not(def.valid ?? valid), errors)
  }
}

function modifyData(cxt: KeywordCxt): void {
  const {gen, data, it} = cxt
  gen.if(it.parentData, () => gen.assign(data, _`${it.parentData}[${it.parentDataProperty}]`))
}

function addErrs(cxt: KeywordCxt, errs: Code): void {
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

function checkAsync({schemaEnv}: SchemaObjCxt, def: FuncKeywordDefinition): void {
  if (def.async && !schemaEnv.$async) throw new Error("async keyword in sync schema")
}

function useKeyword(gen: CodeGen, keyword: string, result?: KeywordCompilationResult): Name {
  if (result === undefined) throw new Error(`keyword "${keyword}" failed to compile`)
  return gen.scopeValue(
    "keyword",
    typeof result == "function" ? {ref: result} : {ref: result, code: stringify(result)}
  )
}
