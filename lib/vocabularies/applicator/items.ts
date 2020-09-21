import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema, checkStrictMode} from "../util"
import {applySubschema, Type} from "../../compile/subschema"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordCxt) {
    const {gen, schema, parentSchema, data, it} = cxt
    const len = gen.const("len", _`${data}.length`)
    if (Array.isArray(schema)) {
      validateTuple(schema)
    } else if (!alwaysValidSchema(it, schema)) {
      validateArray()
    }

    function validateTuple(schArr: AnySchema[]): void {
      if (it.opts.strictTuples && !fullTupleSchema(schema.length, parentSchema)) {
        const msg = `"items" is ${schArr.length}-tuple, but minItems or maxItems/additionalItems are not specified or different`
        checkStrictMode(it, msg, it.opts.strictTuples)
      }
      const valid = gen.name("valid")
      schArr.forEach((sch: AnySchema, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        gen.if(_`${len} > ${i}`, () =>
          applySubschema(
            it,
            {
              keyword: "items",
              schemaProp: i,
              dataProp: i,
              strictSchema: it.strictSchema,
            },
            valid
          )
        )
        cxt.ok(valid)
      })
    }

    function validateArray(): void {
      const valid = gen.name("valid")
      gen.forRange("i", 0, len, (i) => {
        applySubschema(
          it,
          {
            keyword: "items",
            dataProp: i,
            dataPropType: Type.Num,
            strictSchema: it.strictSchema,
          },
          valid
        )
        if (!it.allErrors) gen.ifNot(valid, _`break`)
      })
      cxt.ok(valid)
    }
  },
}

function fullTupleSchema(len: number, sch: any): boolean {
  return len === sch.minItems && (len === sch.maxItems || sch.additionalItems === false)
}

export default def
