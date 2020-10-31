import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {MissingRefError} from "../../compile/error_classes"
import {callValidateCode} from "../code"
import {_, nil, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, resolveRef} from "../../compile"
import {
  mergeEvaluatedProps,
  mergeEvaluatedPropsToName,
  mergeEvaluatedItems,
  mergeEvaluatedItemsToName,
} from "../../compile/util"

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    const {allErrors, baseId, schemaEnv: env, opts, validateName, self} = it
    const passCxt = opts.passContext ? N.this : nil
    if (schema === "#" || schema === "#/") return callRootRef()
    const schOrFunc = resolveRef.call(self, env.root, baseId, schema)
    if (schOrFunc === undefined) throw new MissingRefError(baseId, schema)
    if (schOrFunc instanceof SchemaEnv) return callValidate(schOrFunc)
    return inlineRefSchema(schOrFunc)

    function callRootRef(): void {
      if (env === env.root) return callRef(validateName, env, env.$async)
      const rootName = gen.scopeValue("root", {ref: env.root})
      return callRef(_`${rootName}.validate`, env.root, env.root.$async)
    }

    function callValidate(sch: SchemaEnv): void {
      let v: Code
      if (sch.validate) {
        v = gen.scopeValue("validate", {ref: sch.validate})
      } else {
        const code = _`{validate: ${sch.validateName}}`
        const wrapper = gen.scopeValue("wrapper", {ref: sch, code})
        v = _`${wrapper}.validate`
      }
      callRef(v, sch, sch.$async)
    }

    function callRef(v: Code, sch: SchemaEnv, $async?: boolean): void {
      if ($async) callAsyncRef(v, sch)
      else callSyncRef(v, sch)
    }

    function inlineRefSchema(sch: AnySchema): void {
      const schName = gen.scopeValue("schema", {ref: sch})
      const valid = gen.name("valid")
      const schCxt = cxt.subschema(
        {
          schema: sch,
          strictSchema: true,
          dataTypes: [],
          schemaPath: nil,
          topSchemaRef: schName,
          errSchemaPath: schema,
        },
        valid
      )
      cxt.mergeEvaluated(schCxt)
      cxt.ok(valid)
    }

    function callAsyncRef(v: Code, sch: SchemaEnv): void {
      if (!env.$async) throw new Error("async schema referenced by sync schema")
      const valid = gen.let("valid")
      gen.try(
        () => {
          gen.code(_`await ${callValidateCode(cxt, v, passCxt)}`)
          addEvaluatedFrom(v, sch)
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

    function callSyncRef(v: Code, sch: SchemaEnv): void {
      cxt.result(
        callValidateCode(cxt, v, passCxt),
        () => addEvaluatedFrom(v, sch),
        () => addErrorsFrom(v)
      )
    }

    function addErrorsFrom(source: Code): void {
      const errs = _`${source}.errors`
      gen.assign(N.vErrors, _`${N.vErrors} === null ? ${errs} : ${N.vErrors}.concat(${errs})`) // TODO tagged
      gen.assign(N.errors, _`${N.vErrors}.length`)
    }

    function addEvaluatedFrom(source: Code, sch: SchemaEnv): void {
      if (!it.opts.unevaluated) return
      const schEvaluated = sch.validate?.evaluated
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = mergeEvaluatedProps(gen, schEvaluated.props, it.props)
          }
        } else {
          const props = gen.var("props", _`${source}.evaluated.props`)
          it.props = mergeEvaluatedPropsToName(gen, props, it.props)
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = mergeEvaluatedItems(gen, schEvaluated.items, it.items)
          }
        } else {
          const props = gen.var("items", _`${source}.evaluated.items`)
          it.items = mergeEvaluatedItemsToName(gen, props, it.items)
        }
      }
    }
  },
}

export default def
