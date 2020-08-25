import {CodeKeywordDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  // TODO
  // implements: ["additionalItems"],
  code(cxt) {
    // TODO strict mode: fail or warning if "additionalItems" is present without "items"
    const {gen, ok, fail, schema, parentSchema, data, it} = cxt
    const len = gen.name("len")
    gen.code(`const ${len} = ${data}.length;`)

    if (Array.isArray(schema)) {
      validateItemsArray(schema)
    } else if (!alwaysValidSchema(it, schema)) {
      validateItems("items", 0)
    }

    function validateItemsArray(sch: (object | boolean)[]) {
      const addIts = parentSchema.additionalItems
      if (addIts === false) validateDataLength(sch)
      validateDefinedItems()
      if (typeof addIts == "object" && !alwaysValidSchema(it, addIts)) {
        gen.if(`${len} > ${sch.length}`, () => validateItems("additionalItems", sch.length))
      }
    }

    function validateDataLength(sch: (object | boolean)[]): void {
      fail(`${len} > ${sch.length}`, undefined, {
        ...cxt,
        keyword: "additionalItems",
        schemaValue: false,
      })
    }

    function validateDefinedItems(): void {
      const valid = gen.name("valid")
      schema.forEach((sch: any, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        gen.if(`${len} > ${i}`, () =>
          applySubschema(
            it,
            {
              keyword: "items",
              schemaProp: i,
              dataProp: i,
              expr: Expr.Const,
            },
            valid
          )
        )
        ok(valid)
      })
    }

    function validateItems(keyword: string, startFrom: number): void {
      const i = gen.name("i")
      const valid = gen.name("valid")
      gen.for(`let ${i}=${startFrom}; ${i}<${len}; ${i}++`, () => {
        applySubschema(it, {keyword, dataProp: i, expr: Expr.Num}, valid)
        if (!it.allErrors) gen.if(`!${valid}`, "break")
      })
      ok(valid)
    }
  },
  error: {
    message: ({schema}) => `"should NOT have more than ${schema.length as number} items"`,
    params: ({schema}) => `{limit: ${schema.length as number}}`,
  },
}

module.exports = def
