import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {orExpr} from "../util"
import {_, Name, Code, Expression} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    const {opts} = it
    if ($data) {
      const valid = gen.let("valid")
      gen.if(
        `${schemaCode} === undefined`,
        () => gen.assign(valid, true),
        () => gen.assign(valid, false).if(`Array.isArray(${schemaCode})`, () => loopEnum(valid))
      )
      cxt.pass(valid)
    } else {
      if (schema.length === 0) throw new Error("enum must have non-empty array")
      if (schema.length > (opts.loopEnum as number)) {
        const valid = gen.let("valid", false)
        loopEnum(valid)
        cxt.pass(valid)
      } else {
        const vSchema = gen.const("schema", schemaCode)
        const cond: Expression = orExpr(schema, (_x, i) => equalCode(vSchema, i))
        cxt.pass(cond)
      }
    }

    function loopEnum(valid: Name): void {
      const v = gen.name("v")
      gen.for(`const ${v} of ${schemaCode}`, () =>
        gen.if(_`equal(${data}, ${v})`, _`${valid} = true; break;`)
      )
    }

    function equalCode(vSchema: Name, i: number): Code {
      const sch: string = schema[i]
      if (sch && typeof sch === "object") {
        return _`equal(${data}, ${vSchema}[${i}])`
      }
      return _`${data} === ${sch}`
    }
  },
  error: {
    message: "should be equal to one of the allowed values",
    params: ({schemaCode}) => _`{allowedValues: ${schemaCode}}`,
  },
}

module.exports = def
