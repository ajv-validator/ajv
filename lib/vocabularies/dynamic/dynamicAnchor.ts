import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, getProperty} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicAnchor",
  schemaType: "string",
  code: (cxt) => dynamicAnchor(cxt, cxt.schema),
}

export function dynamicAnchor(cxt: KeywordCxt, anchor: string): void {
  const {gen, keyword, it} = cxt
  it.dynamicAnchors[anchor] = true
  const v = _`${N.dynamicAnchors}${getProperty(anchor)}`
  if (it.errSchemaPath === "#") {
    gen.if(_`!${v}`, () => gen.assign(v, it.validateName))
  } else {
    // TODO add support for dynamicRef/recursiveRef not in schema root
    // const validate = it.self.getSchema()
    throw new Error(`"${keyword}" is only supported in schema root`)
  }
}

export default def
