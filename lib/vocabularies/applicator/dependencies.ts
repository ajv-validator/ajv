import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema, quotedString, propertyInData} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {escapeQuotes} from "../../compile/util"
import {checkReportMissingProp, checkMissingProp, reportMissingProp} from "../missing"

interface PropertyDependencies {
  [x: string]: string[]
}
interface SchemaDependencies {
  [x: string]: object | boolean
}

const def: CodeKeywordDefinition = {
  keyword: "dependencies",
  type: "object",
  schemaType: "object",
  code(cxt) {
    const {gen, ok, errorParams, schema, data, it} = cxt

    const [propDeps, schDeps] = splitDependencies()

    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)

    gen.block(() => {
      validatePropertyDeps(propDeps)
      validateSchemaDeps(schDeps)
    })

    ok(`${errsCount} === errors`)

    function splitDependencies(): [PropertyDependencies, SchemaDependencies] {
      const propertyDeps: PropertyDependencies = {}
      const schemaDeps: SchemaDependencies = {}
      for (const key in schema) {
        if (key === "__proto__") continue
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps
        deps[key] = schema[key]
      }
      return [propertyDeps, schemaDeps]
    }

    function validatePropertyDeps(propertyDeps: {[x: string]: string[]}): void {
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop]
        if (deps.length === 0) continue
        const hasProperty = propertyInData(data, prop, Expr.Const, it.opts.ownProperties)
        errorParams({
          property: prop,
          depsCount: "" + deps.length,
          deps: deps.join(", "),
        })
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              checkReportMissingProp(cxt, depProp, def.error as KeywordErrorDefinition)
            }
          })
        } else {
          // TODO refactor: maybe use one variable for all dependencies
          // or not use this variable at all?
          const missing = gen.name("missing")
          gen.code(`let ${missing};`)
          gen.if(`${hasProperty} && (${checkMissingProp(cxt, deps, missing)})`)
          reportMissingProp(cxt, missing, def.error as KeywordErrorDefinition)
          gen.else()
        }
      }
    }

    function validateSchemaDeps(schemaDeps: {[x: string]: object | boolean}): void {
      for (const prop in schemaDeps) {
        if (alwaysValidSchema(it, schemaDeps[prop])) continue
        gen.if(
          propertyInData(data, prop, Expr.Const, it.opts.ownProperties),
          () => applySubschema(it, {keyword: "dependencies", schemaProp: prop}, valid),
          `var ${valid} = true;` // TODO refactor var
        )
        if (!it.allErrors) gen.if(valid)
      }
    }
  },
  error: {
    message: ({params: {property, depsCount, deps}}) => {
      const requiredProps = (depsCount === "1" ? "property " : "properties ") + escapeQuotes(deps)
      return `'should have ${requiredProps} when property ${escapeQuotes(property)} is present'`
    },
    params: ({params: {property, depsCount, deps, missingProperty}}) =>
      `{property: ${quotedString(property)},
      missingProperty: ${missingProperty},
      depsCount: ${depsCount},
      deps: ${quotedString(deps)}}`, // TODO change to reference?
  },
}

module.exports = def
