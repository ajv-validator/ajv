import {KeywordDefinition} from "../../types"
import {quotedString} from "../util"

const def: KeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  code({gen, fail, data, $data, schema, schemaCode, it: {opts}}) {
    if ($data) {
      const valid = gen.name("valid")
      gen.code(`let ${valid};`)
      gen.if(`${schemaCode} === undefined`, `${valid} = true;`, () =>
        gen.code(`${valid} = false;`).if(`Array.isArray(${schemaCode})`, () => loopEnum(valid))
      )
      fail(`!${valid}`)
    } else {
      if (schema.length === 0) throw new Error("enum must have non-empty array")
      if (schema.length > (opts.loopEnum as number)) {
        const valid = gen.name("valid")
        gen.code(`let ${valid} = false;`)
        loopEnum(valid)
        fail(`!${valid}`)
      } else {
        const vSchema = gen.name("schema")
        gen.code(`const ${vSchema} = ${schemaCode};`)
        const cond: string = schema
          .map((_, i: number) => equalCode(vSchema, i))
          .reduce((acc: string, eq: string) => `${acc} || ${eq}`)
        fail(`!(${cond})`)
      }
    }

    function loopEnum(valid: string): void {
      gen.for(`const v of ${schemaCode}`, () =>
        gen.if(`equal(${data}, v)`, `${valid} = true; break;`)
      )
    }

    function equalCode(vSchema: string, i: number): string {
      let sch: string = schema[i]
      if (sch && typeof sch === "object") {
        return `equal(${data}, ${vSchema}[${i}])`
      }
      if (typeof sch === "string") sch = quotedString(sch)
      return `${data} === ${sch}`
    }
  },
  error: {
    message: "should be equal to one of the allowed values",
    params: ({schemaCode}) => `{allowedValues: ${schemaCode}}`,
  },
}

module.exports = def
