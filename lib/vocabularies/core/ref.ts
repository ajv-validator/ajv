import {CodeKeywordDefinition, Schema, ValidateFunction} from "../../types"
import KeywordCxt from "../../compile/context"
import {MissingRefError} from "../../compile/error_classes"
import {applySubschema} from "../../compile/subschema"
import {callValidateCode} from "../util"
import {_, str, nil, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    const {resolveRef, allErrors, baseId, isRoot, root, opts, validateName, self} = it
    const passCxt = opts.passContext ? N.this : nil
    if (schema === "#" || schema === "#/") return callRootRef()
    const schOrFunc = resolveRef(baseId, schema)
    if (schOrFunc === undefined) return missingRef()
    if (typeof schOrFunc == "function") return callCompiledRef(schOrFunc)
    return inlineRefSchema(schOrFunc)

    function callRootRef(): void {
      if (isRoot) return callRef(validateName, it.async)
      const rootName = gen.scopeValue("root", {ref: root.localRoot})
      return callRef(_`${rootName}.validate`, root.$async)
    }

    function callCompiledRef(func: ValidateFunction): void {
      const v = gen.scopeValue("validate", {ref: func})
      return callRef(v, func.$async)
    }

    function callRef(v: Code, $async?: boolean): void {
      if ($async || it.async) validateAsyncRef(v)
      else validateSyncRef(v)
    }

    function inlineRefSchema(sch: Schema): void {
      const schName = gen.scopeValue("schema", {ref: sch})
      const valid = gen.name("valid")
      applySubschema(
        it,
        {
          schema: sch,
          schemaPath: nil,
          topSchemaRef: schName,
          errSchemaPath: schema,
        },
        valid
      )
      cxt.ok(valid)
    }

    function missingRef(): void {
      const msg = MissingRefError.message(baseId, schema)
      switch (opts.missingRefs) {
        case "fail":
          self.logger.error(msg)
          cxt.fail()
          return
        case "ignore":
          self.logger.warn(msg)
          return
        default:
          throw new MissingRefError(baseId, schema, msg)
      }
    }

    function validateAsyncRef(v: Code): void {
      if (!it.async) throw new Error("async schema referenced by sync schema")
      const valid = gen.let("valid")
      gen.try(
        () => {
          gen.code(_`await ${callValidateCode(cxt, v, passCxt)}`)
          if (!allErrors) gen.assign(valid, true)
        },
        (e) => {
          gen.if(_`!(${e} instanceof ${it.ValidationError as Name})`, () => gen.throw(e))
          addErrorsFrom(e)
          if (!allErrors) gen.assign(valid, false)
        }
      )
      cxt.ok(valid)
    }

    function validateSyncRef(v: Code): void {
      cxt.pass(callValidateCode(cxt, v, passCxt), () => addErrorsFrom(v))
    }

    function addErrorsFrom(source: Code): void {
      const errs = _`${source}.errors`
      gen.assign(N.vErrors, _`${N.vErrors} === null ? ${errs} : ${N.vErrors}.concat(${errs})`) // TODO tagged
      gen.assign(N.errors, _`${N.vErrors}.length`)
    }
  },
  // TODO incorrect error message
  error: {
    message: ({schema}) => str`can't resolve reference ${schema}`,
    params: ({schema}) => _`{ref: ${schema}}`,
  },
}

module.exports = def
