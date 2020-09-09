import {CodeKeywordDefinition, AddedFormat, FormatValidate} from "../../types"
import KeywordCtx from "../../compile/context"
import {_, str, nil, or, Code, getProperty} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: true,
  code(cxt: KeywordCtx, ruleType?: string) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    const {opts, errSchemaPath, self} = it
    if (opts.format === false) return

    if ($data) validate$DataFormat()
    else validateFormat()

    function validate$DataFormat() {
      const fmts = gen.scopeValue("formats", {
        ref: self.formats,
        code: opts.code?.formats,
      })
      const fDef = gen.const("fDef", _`${fmts}[${schemaCode}]`)
      const fType = gen.let("fType")
      const format = gen.let("format")
      // TODO simplify
      gen.if(
        _`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`,
        () => gen.assign(fType, _`${fDef}.type || "string"`).assign(format, _`${fDef}.validate`),
        () => gen.assign(fType, _`"string"`).assign(format, fDef)
      )
      cxt.fail$data(or(unknownFmt(), invalidFmt())) // TODO this is not tested. Possibly require ajv-formats to test formats in ajv as well

      function unknownFmt(): Code {
        if (opts.unknownFormats === "ignore") return nil
        let unknown = _`${schemaCode} && !${format}`
        if (Array.isArray(opts.unknownFormats)) {
          unknown = _`${unknown} && !${N.self}._opts.unknownFormats.includes(${schemaCode})`
        }
        return _`(${unknown})`
      }

      function invalidFmt(): Code {
        const callFormat = it.async
          ? _`${fDef}.async ? await ${format}(${data}) : ${format}(${data})`
          : _`${format}(${data})`
        const validData = _`typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data})`
        return _`(${format} && ${fType} === ${<string>ruleType} && !(${validData}))`
      }
    }

    function validateFormat() {
      const formatDef: AddedFormat = self.formats[schema]
      if (!formatDef) {
        unknownFormat()
        return
      }
      const [fmtType, format, fmtRef] = getFormat(formatDef)
      if (fmtType === ruleType) cxt.pass(validCondition())

      function unknownFormat() {
        if (opts.unknownFormats === "ignore") {
          self.logger.warn(unknownMsg())
          return
        }
        if (Array.isArray(opts.unknownFormats) && opts.unknownFormats.includes(schema)) return
        throw new Error(unknownMsg())

        function unknownMsg(): string {
          return `unknown format "${<string>schema}" ignored in schema at path "${errSchemaPath}"`
        }
      }

      function getFormat(fmtDef: AddedFormat): [string, FormatValidate, Code] {
        const fmt = gen.scopeValue("formats", {
          key: schema,
          ref: fmtDef,
          code: opts.code.formats ? _`${opts.code.formats}${getProperty(schema)}` : undefined,
        })
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
