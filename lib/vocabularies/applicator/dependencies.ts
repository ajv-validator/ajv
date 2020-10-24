import type {
  CodeKeywordDefinition,
  ErrorObject,
  KeywordErrorDefinition,
  SchemaMap,
  AnySchema,
} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, str} from "../../compile/codegen"
import {alwaysValidSchema} from "../../compile/util"
import {checkReportMissingProp, checkMissingProp, reportMissingProp, propertyInData} from "../code"

interface PropertyDependencies {
  [x: string]: string[]
}

type SchemaDependencies = SchemaMap

export type DependenciesError = ErrorObject<
  "dependencies",
  {
    property: string
    missingProperty: string
    depsCount: number
    deps: string // TODO change to string[]
  }
>

const error: KeywordErrorDefinition = {
  message: ({params: {property, depsCount, deps}}) => {
    const property_ies = depsCount === 1 ? "property" : "properties"
    return str`should have ${property_ies} ${deps} when property ${property} is present`
  },
  params: ({params: {property, depsCount, deps, missingProperty}}) =>
    _`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`, // TODO change to reference
}

const def: CodeKeywordDefinition = {
  keyword: "dependencies",
  type: "object",
  schemaType: "object",
  error,
  code(cxt: KeywordCxt) {
    const {gen, schema, data, it} = cxt
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
      if (Object.keys(propertyDeps).length === 0) return
      const missing = gen.let("missing")
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop]
        if (deps.length === 0) continue
        const hasProperty = propertyInData(data, prop, it.opts.ownProperties)
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", "),
        })
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              checkReportMissingProp(cxt, depProp)
            }
          })
        } else {
          gen.if(_`${hasProperty} && (${checkMissingProp(cxt, deps, missing)})`)
          reportMissingProp(cxt, missing)
          gen.else()
        }
      }
    }

    function validateSchemaDeps(schemaDeps: SchemaMap): void {
      for (const prop in schemaDeps) {
        if (alwaysValidSchema(it, schemaDeps[prop] as AnySchema)) continue
        gen.if(
          propertyInData(data, prop, it.opts.ownProperties),
          () => cxt.subschema({keyword: "dependencies", schemaProp: prop}, valid),
          () => gen.var(valid, true) // TODO var
        )
        cxt.ok(valid)
      }
    }
  },
}

export default def
