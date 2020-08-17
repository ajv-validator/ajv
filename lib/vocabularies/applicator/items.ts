import {KeywordDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  code(cxt) {
    const {gen, fail, schema, parentSchema, data, it} = cxt
    let closeBlocks = ""
    const errsCount = gen.name("_errs")
    const len = gen.name("len")
    gen.code(
      `const ${errsCount} = errors;
      const ${len} = ${data}.length;`
    )

    if (Array.isArray(schema)) {
      const addIts = parentSchema.additionalItems
      if (addIts === false) validateDataLength()
      validateDefinedItems()
      if (typeof addIts == "object" && nonEmptySchema(it, addIts)) {
        gen.code(`if (${len} > ${schema.length}) {`)
        validateItems("additionalItems", schema.length)
        gen.code("}")
      }
    } else if (nonEmptySchema(it, schema)) {
      validateItems("items", 0)
    }

    if (!it.opts.allErrors) {
      gen.code(closeBlocks)
      gen.code(`if (${errsCount} === errors) {`)
    }

    function validateDataLength(): void {
      fail(`${len} > ${schema.length}`, {
        ...cxt,
        keyword: "additionalItems",
        schemaValue: false,
      })
      closeBlocks += "}"
    }

    function validateDefinedItems(): void {
      schema.forEach((sch: any, i: number) => {
        if (nonEmptySchema(it, sch)) {
          gen.code(`if (${len} > ${i}) {`)
          const schValid = applySubschema(it, {
            keyword: "items",
            schemaProp: i,
            dataProp: i,
            expr: Expr.Const,
          })
          gen.code(`}`)
          if (!it.opts.allErrors) {
            gen.code(`if (${schValid}) {`)
            closeBlocks += "}"
          }
        }
      })
    }

    function validateItems(keyword: string, startFrom: number): void {
      const i = gen.name("i")
      gen.code(`for (let ${i}=${startFrom}; ${i}<${len}; ${i}++) {`)
      const schValid = applySubschema(it, {keyword, dataProp: i, expr: Expr.Num})
      if (!it.opts.allErrors) {
        gen.code(`if (!${schValid}) {
          break;
        }`)
      }
      gen.code("}")
    }
  },
  error: {
    message: ({schema}) => `"should NOT have more than ${schema.length} items"`,
    params: ({schema}) => `{limit: ${schema.length}}`,
  },
}

module.exports = def
