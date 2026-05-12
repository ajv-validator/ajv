import type {AnySchema, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import MissingRefError from "../../compile/ref_error"
import {_, getProperty, nil, stringify, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, resolveRef} from "../../compile"
import {callRef, getValidate} from "../core/ref"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (cxt) => dynamicRef(cxt, cxt.schema),
}

export function dynamicRef(cxt: KeywordCxt, ref: string): void {
  const {gen, keyword, it} = cxt
  if (ref[0] !== "#") throw new Error(`"${keyword}" only supports hash fragment reference`)
  const anchor = ref.slice(1)
  const {baseId, schemaEnv: env, self} = it
  const {root} = env
  const schOrEnv = resolveRef.call(self, root, baseId, ref)
  let sch: SchemaEnv
  let v: Code
  if (schOrEnv === undefined) {
    if (schemaHasDynamicAnchor(env, anchor)) {
      sch = env
    } else if (root.dynamicAnchors[anchor] || schemaHasDynamicAnchor(root, anchor)) {
      sch = root
    } else {
      throw new MissingRefError(it.opts.uriResolver, baseId, ref)
    }
    v = sch === env ? it.validateName : getValidate(cxt, sch)
  } else {
    if (!(schOrEnv instanceof SchemaEnv)) return inlineRefSchema(schOrEnv)
    sch = schOrEnv
    v = getValidate(cxt, sch)
  }
  const refIsDynamic = schemaHasDynamicAnchor(sch, anchor)
  const fallbackToCurrent = refIsDynamic && !schemaHasValidationRules(sch)
  if (it.allErrors) {
    _dynamicRef()
  } else {
    const valid = gen.let("valid", false)
    _dynamicRef(valid)
    cxt.ok(valid)
  }

  function _dynamicRef(valid?: Name): void {
    if (refIsDynamic && root.dynamicAnchors[anchor]) {
      const dyn = gen.let("_v", _`${N.dynamicAnchors}${getProperty(anchor)}`)
      gen.if(dyn, _callRef(dyn, valid), fallback(valid))
    } else {
      fallback(valid)()
    }
  }

  function fallback(valid?: Name): () => void {
    return fallbackToCurrent ? _callRef(it.validateName, valid) : _callRef(v, valid, sch)
  }

  function _callRef(validate: Code, valid?: Name, refEnv?: SchemaEnv): () => void {
    return valid
      ? () =>
          gen.block(() => {
            callRef(cxt, validate, refEnv, refEnv?.$async)
            gen.let(valid, true)
          })
      : () => callRef(cxt, validate, refEnv, refEnv?.$async)
  }

  function inlineRefSchema(refSchema: AnySchema): void {
    const schName = gen.scopeValue(
      "schema",
      it.opts.code.source === true ? {ref: refSchema, code: stringify(refSchema)} : {ref: refSchema}
    )
    const valid = gen.name("valid")
    const schCxt = cxt.subschema(
      {
        schema: refSchema,
        dataTypes: [],
        schemaPath: nil,
        topSchemaRef: schName,
        errSchemaPath: ref,
      },
      valid
    )
    cxt.mergeEvaluated(schCxt)
    cxt.ok(valid)
  }
}

function schemaHasDynamicAnchor(sch: SchemaEnv, anchor: string): boolean {
  return (
    typeof sch.schema == "object" &&
    (anchor ? sch.schema.$dynamicAnchor === anchor : sch.schema.$recursiveAnchor === true)
  )
}

const ANNOTATION_OR_LOCATION: {[Key in string]?: true} = {
  $comment: true,
  $defs: true,
  $dynamicAnchor: true,
  $id: true,
  $recursiveAnchor: true,
  $schema: true,
  $vocabulary: true,
  contentEncoding: true,
  contentMediaType: true,
  contentSchema: true,
  default: true,
  definitions: true,
  deprecated: true,
  description: true,
  examples: true,
  readOnly: true,
  title: true,
  writeOnly: true,
}

function schemaHasValidationRules(sch: SchemaEnv): boolean {
  if (typeof sch.schema != "object") return true
  for (const key in sch.schema) {
    if (!ANNOTATION_OR_LOCATION[key]) return true
  }
  return false
}

export default def
