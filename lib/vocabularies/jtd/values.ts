import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {Type} from "../../compile/subschema"
import {alwaysValidSchema} from "../../compile/util"
import {not, Name} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullableObject} from "./nullable"

const def: CodeKeywordDefinition = {
  keyword: "values",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const [valid, cond] = checkNullableObject(cxt, data)
    gen.if(cond, () => gen.assign(valid, validateMap()))
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
