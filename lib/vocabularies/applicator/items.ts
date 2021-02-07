import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_} from "../../compile/codegen"
import {alwaysValidSchema, mergeEvaluated} from "../../compile/util"
import {checkStrictMode} from "../../compile/validate"
import {validateArray} from "../code"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    if (Array.isArray(schema)) {
      if (it.opts.unevaluated && schema.length && it.items !== true) {
        it.items = mergeEvaluated.items(gen, schema.length, it.items)
      }
      validateTuple(schema)
    } else {
      it.items = true
      if (alwaysValidSchema(it, schema)) return
      cxt.ok(validateArray(cxt))
    }

    function validateTuple(schArr: AnySchema[]): void {
      const {parentSchema, data} = cxt
      if (it.opts.strictTuples && !fullTupleSchema(schArr.length, parentSchema)) {
        const msg = `"items" is ${schArr.length}-tuple, but minItems or maxItems/additionalItems are not specified or different`
        checkStrictMode(it, msg, it.opts.strictTuples)
      }
      const valid = gen.name("valid")
      const len = gen.const("len", _`${data}.length`)
      schArr.forEach((sch: AnySchema, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        gen.if(_`${len} > ${i}`, () =>
          cxt.subschema(
            {
              keyword: "items",
              schemaProp: i,
              dataProp: i,
            },
            valid
          )
        )
        cxt.ok(valid)
      })
    }
  },
}

function fullTupleSchema(len: number, sch: any): boolean {
  return len === sch.minItems && (len === sch.maxItems || sch.additionalItems === false)
}

export default def
