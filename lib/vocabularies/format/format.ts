import {CodeKeywordDefinition, AddedFormat, FormatValidate} from "../../types"
import KeywordContext from "../../compile/context"
import {bad$DataType} from "../util"
import {_, str, nil, or, Code, getProperty} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: true,
  code(cxt: KeywordContext, ruleType?: string) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    const {formats, opts, logger, errSchemaPath} = it
    if (opts.format === false) return

    if ($data) validate$DataFormat()
    else validateFormat()

    function validate$DataFormat() {
      const fDef = gen.const("fDef", _`formats[${schemaCode}]`)
      const fType = gen.let("fType")
      const format = gen.let("format")
      // TODO simplify
      gen.if(
        _`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`,
        () => gen.assign(fType, _`${fDef}.type || "string"`).assign(format, _`${fDef}.validate`),
        () => gen.assign(fType, _`"string"`).assign(format, fDef)
      )
      const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
      cxt.fail(or(bdt, unknownFmt(), invalidFmt()))

      function unknownFmt(): Code {
        if (opts.unknownFormats === "ignore") return nil
        let unknown = _`${schemaCode} && !${format}`
        if (Array.isArray(opts.unknownFormats)) {
          unknown = _`${unknown} && !self._opts.unknownFormats.includes(${schemaCode})`
        }
        return _`(${unknown})`
      }

      function invalidFmt(): Code {
        const fmt = _`${format}(${data})`
        const callFormat = it.async ? _`${fDef}.async ? await ${fmt} : ${fmt}` : fmt
        const validData = _`typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data})`
        return _`(${format} && ${fType} === ${<string>ruleType} && !(${validData}))`
      }
    }

    function validateFormat() {
      const formatDef: AddedFormat = formats[schema]
      if (!formatDef) {
        unknownFormat()
        return
      }
      const [fmtType, format, fmtRef] = getFormat(formatDef)
      if (fmtType === ruleType) cxt.pass(validCondition())

      function unknownFormat() {
        if (opts.unknownFormats === "ignore") return logger.warn(unknownMsg())
        if (Array.isArray(opts.unknownFormats) && opts.unknownFormats.includes(schema)) return
        throw new Error(unknownMsg())

        function unknownMsg(): string {
          return `unknown format "${<string>schema}" ignored in schema at path "${errSchemaPath}"`
        }
      }

      function getFormat(fmtDef: AddedFormat): [string, FormatValidate, Code] {
        const fmt = _`formats${getProperty(schema)}` // TODO use scope for formats?
        if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
          return [fmtDef.type || "string", fmtDef.validate as FormatValidate, _`${fmt}.validate`]
        }

        return ["string", fmtDef, fmt]
      }

      function validCondition(): Code {
        if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
          if (!it.async) throw new Error("async format in sync schema")
          return _`await ${fmtRef}(${data})`
        }
        return typeof format == "function" ? _`${fmtRef}(${data})` : _`${fmtRef}.test(${data})`
      }
    }
  },
  error: {
    message: ({schemaCode}) => str`should match format "${schemaCode}"`,
    params: ({schemaCode}) => _`{format: ${schemaCode}}`,
  },
}

module.exports = def
