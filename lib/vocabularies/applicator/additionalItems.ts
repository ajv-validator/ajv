import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Type} from "../../compile/subschema"
import {_, Name, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  code(cxt: KeywordContext) {
    const {gen, schema, parentSchema, data, it} = cxt
    const len = gen.const("len", _`${data}.length`)
    const items = parentSchema.items
    // TODO strict mode: fail or warning if "additionalItems" is present without "items" Array
    if (!Array.isArray(items)) return
    if (schema === false) {
      cxt.setParams({len: items.length})
      cxt.pass(_`${len} <= ${items.length}`)
    } else if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
      const valid = gen.var("valid", _`${len} <= ${items.length}`) // TODO var
      gen.ifNot(valid, () => validateItems(valid))
      cxt.ok(valid)
    }

    function validateItems(valid: Name): void {
      const i = gen.name("i")
      gen.for(_`let ${i}=${items.length}; ${i}<${len}; ${i}++`, () => {
        applySubschema(it, {keyword: "additionalItems", dataProp: i, dataPropType: Type.Num}, valid)
        if (!it.allErrors) gen.ifNot(valid, _`break`)
      })
    }
  },
  error: {
    message: ({params: {len}}) => str`should NOT have more than ${len} items`,
    params: ({params: {len}}) => _`{limit: ${len}}`,
  },
}

module.exports = def
