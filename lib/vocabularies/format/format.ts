import {CodeKeywordDefinition, AddedFormat, FormatValidate} from "../../types"
import {dataNotType} from "../util"
import {getProperty} from "../../compile/util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: true,
  code({gen, pass, fail, data, $data, schema, schemaCode, it}, ruleType) {
    const {formats, opts, logger, errSchemaPath} = it
    if (opts.format === false) return

    if ($data) validate$DataFormat()
    else validateFormat()

    function validate$DataFormat() {
      const fmtDef = gen.const("fmtDef", `formats[${schemaCode}]`)
      const fmtType = gen.let("fmtType")
      const format = gen.let("format")
      gen.if(
        _`typeof ${fmtDef} == "object" && !(${fmtDef} instanceof RegExp)`,
        _`${fmtType} = ${fmtDef}.type || "string"; ${format} = ${fmtDef}.validate;`,
        _`${fmtType} = "string"; ${format} = ${fmtDef}`
      )
      const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
      fail(dnt + unknownFmt() + invalidFmt())

      function unknownFmt(): string {
        if (opts.unknownFormats === "ignore") return ""
        let unknown = `(${schemaCode} && !${format}`
        if (Array.isArray(opts.unknownFormats)) {
          unknown += ` && !self._opts.unknownFormats.includes(${schemaCode})`
        }
        return unknown + ") || "
      }

      function invalidFmt(): string {
        const fmt = `${format}(${data})`
        const callFormat = it.async ? `${fmtDef}.async ? await ${fmt} : ${fmt}` : fmt
        const validData = `typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data})`
        return `(${format} && ${fmtType} === "${<string>ruleType}" && !(${validData}))`
      }
    }

    function validateFormat() {
      const formatDef: AddedFormat = formats[schema]
      if (!formatDef) {
        unknownFormat()
        return
      }
      const [fmtType, format, fmtRef] = getFormat(formatDef)
      if (fmtType === ruleType) pass(validCondition())

      function unknownFormat() {
        if (opts.unknownFormats === "ignore") return logger.warn(unknownMsg())
        if (Array.isArray(opts.unknownFormats) && opts.unknownFormats.includes(schema)) return
        throw new Error(unknownMsg())

        function unknownMsg(): string {
          return `unknown format "${<string>schema}" ignored in schema at path "${errSchemaPath}"`
        }
      }

      function getFormat(fmtDef: AddedFormat): [string, FormatValidate, string] {
        const fmt = `formats${getProperty(schema)}`
        if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
          return [fmtDef.type || "string", fmtDef.validate as FormatValidate, `${fmt}.validate`]
        }

        return ["string", fmtDef, fmt]
      }

      function validCondition(): string {
        if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
          if (!it.async) throw new Error("async format in sync schema")
          return `await ${fmtRef}(${data})`
        }

        return fmtRef + (typeof format == "function" ? "" : ".test") + `(${data})`
      }
    }
  },
  error: {
    message: ({schemaCode}) => str`should match format "${schemaCode}"`,
    params: ({schemaCode}) => _`{format: ${schemaCode}}`,
  },
}

module.exports = def
