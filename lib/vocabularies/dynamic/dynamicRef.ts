import type {AnySchema, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {callRef, getValidate} from "../core/ref"
import {SchemaEnv, compileSchema} from "../../compile"

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
    // TODO the assumption here is that `recursiveRef: #` always points to the root
    // of the schema object, which is not correct, because there may be $id that
    // makes # point to it, and the target schema may not contain dynamic/recursiveAnchor.
    // Because of that 2 tests in recursiveRef.json fail.
    // This is a similar problem to #815 (`$id` doesn't alter resolution scope for `{ "$ref": "#" }`).
    // (This problem is not tested in JSON-Schema-Test-Suite)

    // Step 1: Try to resolve anchor from localRefs if not already compiled
    const anchorRef = `#${anchor}`
    const anchorSchema = it.schemaEnv.root.localRefs?.[anchorRef]

    // Step 2: If found in localRefs but not yet compiled, compile it
    let anchorValidate: Code | undefined
    if (anchorSchema && !it.schemaEnv.root.dynamicAnchors[anchor]) {
      const sch = compileAnchorSchema(anchorSchema)
      if (sch) {
        anchorValidate = getValidate(cxt, sch)
        // Mark as having dynamic anchor so we use dynamic lookup
        it.schemaEnv.root.dynamicAnchors[anchor] = true
      }
    }

    // Step 3: Generate dynamic lookup code
    if (it.schemaEnv.root.dynamicAnchors[anchor]) {
      // Pre-register if we just compiled the anchor schema
      if (anchorValidate) {
        const av = anchorValidate
        gen.if(_`!${N.dynamicAnchors}${getProperty(anchor)}`, () =>
          gen.assign(_`${N.dynamicAnchors}${getProperty(anchor)}`, av)
        )
      }
      // Dynamic lookup at runtime
      const v = gen.let("_v", _`${N.dynamicAnchors}${getProperty(anchor)}`)
      gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid))
    } else {
      _callRef(it.validateName, valid)()
    }
  }

  function compileAnchorSchema(schema: AnySchema): SchemaEnv | undefined {
    const {schemaEnv, self} = it
    const {root, baseId, localRefs, meta} = schemaEnv.root
    const {schemaId} = self.opts

    const sch = new SchemaEnv({schema, schemaId, root, baseId, localRefs, meta})
    compileSchema.call(self, sch)
    return sch
  }

  function _callRef(validate: Code, valid?: Name): () => void {
    return valid
      ? () =>
          gen.block(() => {
            callRef(cxt, validate)
            gen.let(valid, true)
          })
      : () => callRef(cxt, validate)
  }
}

export default def
