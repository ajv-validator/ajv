import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema, propertyInData} from "../util"
import {applySubschema} from "../../compile/subschema"
import {checkReportMissingProp, checkMissingProp, reportMissingProp} from "../missing"
import {_, str} from "../../compile/codegen"

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
    validatePropertyDeps(propDeps)
    validateSchemaDeps(schDeps)

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
        const hasProperty = propertyInData(data, prop, it.opts.ownProperties)
        errorParams({
          property: prop,
          depsCount: deps.length,
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
          const missing = gen.let("missing")
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
          propertyInData(data, prop, it.opts.ownProperties),
          () => applySubschema(it, {keyword: "dependencies", schemaProp: prop}, valid),
          `var ${valid} = true;` // TODO refactor var
        )
        ok(valid)
      }
    }
  },
  error: {
    message: ({params: {property, depsCount, deps}}) => {
      const property_ies = depsCount === 1 ? "property" : "properties"
      return str`should have ${property_ies} ${deps} when property ${property} is present`
    },
    params: ({params: {property, depsCount, deps, missingProperty}}) =>
      _`{property: ${property},
      missingProperty: ${missingProperty},
      depsCount: ${depsCount},
      deps: ${deps}}`, // TODO change to reference?
  },
}

module.exports = def
