import {CodeKeywordDefinition, Schema} from "../../types"
import KeywordCxt from "../../compile/context"
import {MissingRefError} from "../../compile/error_classes"
import {applySubschema} from "../../compile/subschema"
import {callValidateCode} from "../util"
import {_, str, nil, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"

// TODO remove these interfaces
type ResolvedRef = InlineResolvedRef | FuncResolvedRef

interface InlineResolvedRef {
  code: Code
  schema: Schema
  inline: true
}

interface FuncResolvedRef {
  code: Code
  $async?: boolean
  inline?: false
}

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    const {resolveRef, allErrors, baseId, isRoot, root, opts, validateName, self} = it
    const ref = getRef()
    const passCxt = opts.passContext ? N.this : nil
    if (ref === undefined) missingRef()
    else if (ref.inline) applyRefSchema(ref)
    else if (ref.$async || it.async) validateAsyncRef(ref.code)
    else validateRef(ref.code)

    function getRef(): ResolvedRef | undefined {
      if (schema === "#" || schema === "#/") {
        if (isRoot) return {code: validateName, $async: it.async}
        const rootName = gen.scopeValue("root", {ref: root.localRoot})
        return {
          code: _`${rootName}.validate`,
          $async: typeof root.schema == "object" && root.schema.$async === true,
        }
      }

      const schOrFunc = resolveRef(baseId, schema)
      if (typeof schOrFunc == "function") {
        const code = gen.scopeValue("validate", {ref: schOrFunc})
        return {code, $async: schOrFunc.$async}
      } else if (typeof schOrFunc == "boolean" || typeof schOrFunc == "object") {
        const code = gen.scopeValue("schema", {ref: schOrFunc})
        return {code, schema: schOrFunc, inline: true}
      }
      return undefined
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

    function applyRefSchema(inlineRef: InlineResolvedRef): void {
      const valid = gen.name("valid")
      applySubschema(
        it,
        {
          schema: inlineRef.schema,
          schemaPath: nil,
          topSchemaRef: inlineRef.code,
          errSchemaPath: schema,
        },
        valid
      )
      cxt.ok(valid)
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

    function validateRef(v: Code): void {
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
