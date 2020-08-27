import {CodeKeywordDefinition, KeywordContext} from "../../types"
import {MissingRefError} from "../../compile/error_classes"
import {applySubschema} from "../../compile/subschema"
import {ResolvedRef, InlineResolvedRef} from "../../compile"
import {callValidate} from "../util"
import {_, Expression} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt: KeywordContext) {
    const {gen, ok, fail, schema, it} = cxt
    const {resolveRef, allErrors, baseId, isRoot, root, opts, logger} = it
    const ref = getRef()
    const passCxt = opts.passContext ? "this" : ""
    if (ref === undefined) missingRef()
    else if (ref.inline) applyRefSchema(ref)
    else if (ref.$async || it.async) validateAsyncRef(ref.code)
    else validateRef(ref.code)

    function getRef(): ResolvedRef | void {
      if (schema === "#" || schema === "#/") {
        return isRoot
          ? {code: N.validate, $async: it.async}
          : {code: "root.refVal[0]", $async: root.schema.$async === true}
      }
      return resolveRef(baseId, schema, isRoot)
    }

    function missingRef(): void {
      const msg = MissingRefError.message(baseId, schema)
      switch (opts.missingRefs) {
        case "fail":
          logger.error(msg)
          return fail()
        case "ignore":
          logger.warn(msg)
          return
        default:
          throw new MissingRefError(baseId, schema, msg)
      }
    }

    function applyRefSchema(inlineRef: InlineResolvedRef): void {
      const valid = gen.name("valid")
      applySubschema(
        it,
        {
          schema: inlineRef.schema,
          schemaPath: "",
          topSchemaRef: inlineRef.code,
          errSchemaPath: schema,
        },
        valid
      )
      ok(valid)
    }

    function validateAsyncRef(v: Expression): void {
      if (!it.async) throw new Error("async schema referenced by sync schema")
      const valid = gen.let("valid")
      gen.try(
        () => {
          gen.code(`await ${callValidate(cxt, v, passCxt)};`)
          if (!allErrors) gen.code(`${valid} = true;`)
        },
        (e) => {
          gen.if(_`!(${e} instanceof ValidationError)`, `throw ${e}`)
          addErrorsFrom(e)
          if (!allErrors) gen.code(`${valid} = false;`)
        }
      )
      ok(valid)
    }

    function validateRef(v: Expression): void {
      fail(`!${callValidate(cxt, v, passCxt)}`, () => addErrorsFrom(v))
    }

    function addErrorsFrom(source: Expression): void {
      const errs = `${source}.errors`
      gen.assign(N.vErrors, `${N.vErrors} === null ? ${errs} : ${N.vErrors}.concat(${errs})`) // TODO tagged
      gen.assign(N.errors, _`${N.vErrors}.length`)
    }
  },
  // TODO incorrect error message
  error: {
    message: ({schemaCode}) => `'should match format "' + ${schemaCode} + '"'`,
    params: ({schemaCode}) => `{format: ${schemaCode}}`,
  },
}

module.exports = def
