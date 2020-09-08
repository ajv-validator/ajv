import {
  KeywordDefinition,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  SchemaObjCtx,
  KeywordCompilationResult,
} from "../../types"
import KeywordCtx from "../context"
import {applySubschema} from "../subschema"
import {extendErrors} from "../errors"
import {callValidateCode} from "../../vocabularies/util"
import {CodeGen, _, nil, Code, Name} from "../codegen"
import N from "../names"

export function keywordCode(
  it: SchemaObjCtx,
  keyword: string,
  def: KeywordDefinition,
  ruleType?: string
): void {
  const cxt = new KeywordCtx(it, def, keyword)
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

function macroKeywordCode(cxt: KeywordCtx, def: MacroKeywordDefinition): void {
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

function funcKeywordCode(cxt: KeywordCtx, def: FuncKeywordDefinition): void {
  const {gen, keyword, schema, parentSchema, $data, it} = cxt
  checkAsync(it, def)
  const validate =
    !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate
  const validateRef = useKeyword(gen, keyword, validate)
  const valid = gen.let("valid")
  cxt.block$data(valid, validateKeyword)
  cxt.ok(def.valid ?? valid)

  function validateKeyword() {
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
          _`${e} instanceof ValidationError`,
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
    gen.assign(valid, _`${_await}${callValidateCode(cxt, validateRef, passCxt, passSchema)}`)
  }

  // TODO maybe refactor to gen.ifNot(def.valid ?? valid, repErrs) once dead branches are removed
  function reportErrs(errors: () => void): void {
    if (def.valid === false) errors()
    else if (def.valid !== true) gen.ifNot(valid, errors)
  }
}

function modifyData(cxt: KeywordCtx) {
  const {gen, data, it} = cxt
  gen.if(it.parentData, () => gen.assign(data, _`${it.parentData}[${it.parentDataProperty}]`))
}

function addErrs(cxt: KeywordCtx, errs: Code): void {
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

function checkAsync(it: SchemaObjCtx, def: FuncKeywordDefinition) {
  if (def.async && !it.async) throw new Error("async keyword in sync schema")
}

function useKeyword(gen: CodeGen, keyword: string, result?: KeywordCompilationResult): Name {
  if (result === undefined) throw new Error(`keyword "${keyword}" failed to compile`)
  return gen.value("keyword", {ref: result}) // TODO value.code
}
