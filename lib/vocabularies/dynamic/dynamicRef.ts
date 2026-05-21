import type {AnySchema, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, compileSchema, resolveRef} from "../../compile"
import MissingRefError from "../../compile/ref_error"
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
  if (it.allErrors) {
    _dynamicRef()
  } else {
    const valid = gen.let("valid", false)
    _dynamicRef(valid)
    cxt.ok(valid)
  }

  function _dynamicRef(valid?: Name): void {
    const staticRef = getStaticRef(cxt, ref, anchor)
    if (staticRef.dynamic) {
      const v = gen.let("_v", _`${N.dynamicAnchors}${getProperty(anchor)}`)
      gen.if(v, _callRef(v, valid), _callRef(staticRef.validate, valid, staticRef.schemaEnv))
    } else {
      _callRef(staticRef.validate, valid, staticRef.schemaEnv)()
    }
  }

  function _callRef(validate: Code, valid?: Name, schemaEnv?: SchemaEnv): () => void {
    return valid
      ? () =>
          gen.block(() => {
            callRef(cxt, validate, schemaEnv, schemaEnv?.$async)
            gen.let(valid, true)
          })
      : () => callRef(cxt, validate, schemaEnv, schemaEnv?.$async)
  }
}

function getStaticRef(
  cxt: KeywordCxt,
  ref: string,
  anchor: string
): {validate: Code; schemaEnv?: SchemaEnv; dynamic: boolean} {
  const {baseId, schemaEnv, self} = cxt.it
  const staticRef = resolveRef.call(self, schemaEnv.root, baseId, ref)
  if (staticRef === undefined) {
    if (schemaEnv.root.dynamicAnchors[anchor]) {
      return {validate: cxt.it.validateName, dynamic: true}
    }
    throw new MissingRefError(self.opts.uriResolver, baseId, ref)
  }
  const refEnv = staticRef instanceof SchemaEnv ? staticRef : compileRef(cxt, staticRef)
  const {schema} = refEnv
  const dynamic =
    typeof schema == "object" &&
    (anchor ? schema.$dynamicAnchor === anchor : schema.$recursiveAnchor === true)
  return {validate: getValidate(cxt, refEnv), schemaEnv: refEnv, dynamic}
}

function compileRef(cxt: KeywordCxt, schema: AnySchema): SchemaEnv {
  const {schemaEnv, self} = cxt.it
  const {schemaId} = self.opts
  const {root, baseId, localRefs, meta} = schemaEnv.root
  const sch = new SchemaEnv({schema, schemaId, root, baseId, localRefs, meta})
  compileSchema.call(self, sch)
  return sch
}

export default def
