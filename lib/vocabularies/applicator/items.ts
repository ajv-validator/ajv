import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {fail_} from "../../keyword"

const def: KeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt) {
    const {gen, /* fail, */ schema, parentSchema, data, it} = cxt
    const errsCount = gen.name("_errs")
    const len = gen.name("len")
    gen.code(
      `const ${errsCount} = errors;
      const ${len} = ${data}.length;`
    )

    if (it.allErrors) {
      validateItemsKeyword()
    } else {
      gen.block(validateItemsKeyword)
      // TODO refactor ifs
      gen.code(`if (${errsCount} === errors) {`)
    }

    function validateItemsKeyword(): void {
      if (Array.isArray(schema)) {
        const addIts = parentSchema.additionalItems
        if (addIts === false) validateDataLength(schema)
        validateDefinedItems()
        if (typeof addIts == "object" && !alwaysValidSchema(it, addIts)) {
          gen.if(`${len} > ${schema.length}`, () => validateItems("additionalItems", schema.length))
        }
      } else if (!alwaysValidSchema(it, schema)) {
        validateItems("items", 0)
      }
    }

    function validateDataLength(sch: any[]): void {
      // TODO replace with "fail"
      fail_(
        `${len} > ${sch.length}`,
        {
          ...cxt,
          keyword: "additionalItems",
          schemaValue: false,
        },
        def.error as KeywordErrorDefinition
      )
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
        if (!it.allErrors) gen.if(valid)
      })
    }

    function validateItems(keyword: string, startFrom: number): void {
      const i = gen.name("i")
      const valid = gen.name("valid")
      gen.for(`let ${i}=${startFrom}; ${i}<${len}; ${i}++`, () => {
        applySubschema(it, {keyword, dataProp: i, expr: Expr.Num}, valid)
        if (!it.allErrors) gen.code(`if(!${valid}){break}`)
      })
    }
  },
  error: {
    message: ({schema}) => `"should NOT have more than ${schema.length as number} items"`,
    params: ({schema}) => `{limit: ${schema.length as number}}`,
  },
}

module.exports = def
