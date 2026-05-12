import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import MissingRefError from "../../compile/ref_error"
import {callValidateCode} from "../code"
import {_, getProperty, nil, stringify, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, resolveRef} from "../../compile"
import {mergeEvaluated} from "../../compile/util"

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt: KeywordCxt): void {
    const {gen, schema: $ref, it} = cxt
    const {baseId, schemaEnv: env, validateName, opts, self} = it
    const {root} = env
    if (opts.dynamicRef) setupDynamicAnchors(cxt)
    if (($ref === "#" || $ref === "#/") && baseId === root.baseId) return callRootRef()
    const schOrEnv = resolveRef.call(self, root, baseId, $ref)
    if (schOrEnv === undefined) throw new MissingRefError(it.opts.uriResolver, baseId, $ref)
    if (schOrEnv instanceof SchemaEnv) return callValidate(schOrEnv)
    return inlineRefSchema(schOrEnv)

    function callRootRef(): void {
      if (env === root) return callRef(cxt, validateName, env, env.$async)
      const rootName = gen.scopeValue("root", {ref: root})
      return callRef(cxt, _`${rootName}.validate`, root, root.$async)
    }

    function callValidate(sch: SchemaEnv): void {
      const v = getValidate(cxt, sch)
      callRef(cxt, v, sch, sch.$async)
    }

    function inlineRefSchema(sch: AnySchema): void {
      const schName = gen.scopeValue(
        "schema",
        opts.code.source === true ? {ref: sch, code: stringify(sch)} : {ref: sch}
      )
      const valid = gen.name("valid")
      const schCxt = cxt.subschema(
        {
          schema: sch,
          dataTypes: [],
          schemaPath: nil,
          topSchemaRef: schName,
          errSchemaPath: $ref,
        },
        valid
      )
      cxt.mergeEvaluated(schCxt)
      cxt.ok(valid)
    }
  },
}

export function getValidate(cxt: KeywordCxt, sch: SchemaEnv): Code {
  const {gen} = cxt
  return sch.validate
    ? gen.scopeValue("validate", {ref: sch.validate})
    : _`${gen.scopeValue("wrapper", {ref: sch})}.validate`
}

export function callRef(cxt: KeywordCxt, v: Code, sch?: SchemaEnv, $async?: boolean): void {
  const {gen, it} = cxt
  const {allErrors, schemaEnv: env, opts} = it
  const passCxt = opts.passContext ? N.this : nil
  if ($async) callAsyncRef()
  else callSyncRef()

  function callAsyncRef(): void {
    if (!env.$async) throw new Error("async schema referenced by sync schema")
    const valid = gen.let("valid")
    gen.try(
      () => {
        gen.code(_`await ${callValidateCode(cxt, v, passCxt)}`)
        addEvaluatedFrom(v) // TODO will not work with async, it has to be returned with the result
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

  function callSyncRef(): void {
    cxt.result(
      callValidateCode(cxt, v, passCxt),
      () => addEvaluatedFrom(v),
      () => addErrorsFrom(v)
    )
  }

  function addErrorsFrom(source: Code): void {
    const errs = _`${source}.errors`
    gen.assign(N.vErrors, _`${N.vErrors} === null ? ${errs} : ${N.vErrors}.concat(${errs})`) // TODO tagged
    gen.assign(N.errors, _`${N.vErrors}.length`)
  }

  function addEvaluatedFrom(source: Code): void {
    if (!it.opts.unevaluated) return
    const schEvaluated = sch?.validate?.evaluated
    // TODO refactor
    if (it.props !== true) {
      if (schEvaluated && !schEvaluated.dynamicProps) {
        if (schEvaluated.props !== undefined) {
          it.props = mergeEvaluated.props(gen, schEvaluated.props, it.props)
        }
      } else {
        const props = gen.var("props", _`${source}.evaluated.props`)
        it.props = mergeEvaluated.props(gen, props, it.props, Name)
      }
    }
    if (it.items !== true) {
      if (schEvaluated && !schEvaluated.dynamicItems) {
        if (schEvaluated.items !== undefined) {
          it.items = mergeEvaluated.items(gen, schEvaluated.items, it.items)
        }
      } else {
        const items = gen.var("items", _`${source}.evaluated.items`)
        it.items = mergeEvaluated.items(gen, items, it.items, Name)
      }
    }
  }
}

function setupDynamicAnchors(cxt: KeywordCxt): void {
  const {gen, it} = cxt
  const {baseId, schemaEnv: env, self} = it
  for (const anchor of dynamicAnchorsForBaseId(env, baseId)) {
    const ref = anchor ? `#${anchor}` : "#"
    const schOrEnv = resolveRef.call(self, env.root, baseId, ref)
    if (!(schOrEnv instanceof SchemaEnv) || !schemaHasDynamicAnchor(schOrEnv, anchor)) continue
    const v = _`${N.dynamicAnchors}${getProperty(anchor)}`
    const validate = getValidate(cxt, schOrEnv)
    gen.if(_`!${v}`, () => gen.assign(v, validate))
  }

  function dynamicAnchorsForBaseId(schemaEnv: SchemaEnv, refBaseId: string): string[] {
    const anchors: {[Ref in string]?: true} = {}
    const prefix = refBaseId ? `${refBaseId}#` : "#"
    for (const ref in self.refs) {
      if (ref.startsWith(prefix)) addAnchor(ref.slice(prefix.length))
    }
    if (!refBaseId && schemaEnv.root.localRefs) {
      for (const ref in schemaEnv.root.localRefs) {
        if (ref[0] === "#") addAnchor(ref.slice(1))
      }
    }
    return Object.keys(anchors)

    function addAnchor(anchor: string): void {
      if (anchor[0] === "/") return
      anchors[anchor] = true
    }
  }
}

function schemaHasDynamicAnchor(sch: SchemaEnv, anchor: string): boolean {
  return (
    typeof sch.schema == "object" &&
    (anchor ? sch.schema.$dynamicAnchor === anchor : sch.schema.$recursiveAnchor === true)
  )
}

export default def
