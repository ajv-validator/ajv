import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {Type} from "../../compile/subschema"
import {alwaysValidSchema} from "../../compile/util"
import {_, not, and, Code, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "values",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    const {gen, data, schema, parentSchema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const valid = gen.name("valid")
    let cond: Code
    if (parentSchema.nullable) {
      gen.let(valid, _`${data} === null`)
      cond = not(valid)
    } else {
      gen.let(valid, false)
      cond = data
    }
    gen.if(and(cond, _`typeof ${data} == "object" && !Array.isArray(${data})`), () =>
      gen.assign(valid, validateMap())
    )
    cxt.pass(valid)

    function validateMap(): Name | boolean {
      const _valid = gen.name("valid")
      if (it.allErrors) {
        const validMap = gen.let("valid", true)
        validateValues(() => gen.assign(validMap, false))
        return validMap
      }
      gen.var(_valid, true)
      validateValues(() => gen.break())
      return _valid

      function validateValues(notValid: () => void): void {
        gen.forIn("key", data, (key) => {
          cxt.subschema(
            {
              keyword: "values",
              dataProp: key,
              dataPropType: Type.Str,
              strictSchema: it.strictSchema,
            },
            _valid
          )
          gen.if(not(_valid), notValid)
        })
      }
    }
  },
}

export default def
