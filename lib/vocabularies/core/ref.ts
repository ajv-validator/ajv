import {CodeKeywordDefinition} from "../../types"
import {MissingRefError} from "../../compile/error_classes"
import {applySubschema} from "../../compile/subschema"
import {ResolvedRef, InlineResolvedRef} from "../../compile"

const def: CodeKeywordDefinition = {
  keyword: "$ref",
  schemaType: "string",
  code({gen, ok, fail, data, schema, it}) {
    const {resolveRef, allErrors, baseId, isRoot, root, opts, logger} = it
    const ref = getRef()
    if (ref === undefined) missingRef()
    else if (ref.inline) applyRefSchema(ref)
    else if (ref.$async || it.async) validateAsyncRef(ref.code)
    else validateRef(ref.code)

    function getRef(): ResolvedRef | void {
      if (schema === "#" || schema === "#/") {
        return isRoot
          ? {code: "validate", $async: it.async}
          : {code: "root.refVal[0]", $async: root.schema.$async === true}
      }
      return resolveRef(baseId, schema, isRoot)
    }

    function missingRef(): void {
      const msg = MissingRefError.message(baseId, schema)
      switch (opts.missingRefs) {
        case "fail":
          logger.error(msg)
          return fail()
        case "ignore":
          logger.warn(msg)
          return ok()
        default:
          throw new MissingRefError(baseId, schema, msg)
      }
    }

    function applyRefSchema(inlineRef: InlineResolvedRef): void {
      const valid = gen.name("valid")
      applySubschema(
        it,
        {
          schema: inlineRef.schema,
          schemaPath: "",
          topSchemaRef: inlineRef.code,
          errSchemaPath: schema,
        },
        valid
      )
      ok(valid)
    }

    function validateAsyncRef(v: string): void {
      const valid = gen.name("valid")
      if (!it.async) throw new Error("async schema referenced by sync schema")
      if (!allErrors) gen.code(`let ${valid};`)
      gen.try(
        () => {
          gen.code(`await ${callValidate(v)};`)
          if (!allErrors) gen.code(`${valid} = true;`)
        },
        () => {
          gen.if("!(e instanceof ValidationError)", "throw e")
          addErrorsFrom("e")
          if (!allErrors) gen.code(`${valid} = false;`)
        },
        "e"
      )
      ok(valid)
    }

    function validateRef(v: string): void {
      // TODO refactor ifs
      gen.code(`if (!${callValidate(v)}) {`)
      addErrorsFrom(v)
      // refactor ifs
      gen.code(allErrors ? "}" : "} else {")
    }

    function callValidate(v: string): string {
      const {errorPath, dataLevel, dataPathArr} = it
      const dataPath = `(dataPath || '')${errorPath === '""' ? "" : ` + ${errorPath}`}` // TODO joinPaths?
      const parentArgs = dataLevel
        ? `data${dataLevel - 1 || ""}, ${dataPathArr[dataLevel]}`
        : "parentData, parentDataProperty"
      const args = `${data}, ${dataPath}, ${parentArgs}, rootData`
      return opts.passContext ? `${v}.call(this, ${args})` : `${v}(${args})`
    }

    function addErrorsFrom(source: string): void {
      gen.if(
        "vErrors === null",
        `vErrors = ${source}.errors`,
        `vErrors = vErrors.concat(${source}.errors)`
      )
      gen.code(`errors = vErrors.length;`)
    }
  },
  error: {
    message: ({$data, schemaCode}) =>
      $data
        ? `'should match format "' + ${schemaCode} + '"'`
        : `"should match format \\"${(<string>schemaCode).slice(1, -1)}\\""`,
    params: ({schemaCode}) => `{format: ${schemaCode}}`,
  },
}

module.exports = def
