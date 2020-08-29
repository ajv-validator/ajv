import {CompilationContext} from "../../types"
import {_, getProperty} from "../codegen"

export function assignDefaults(it: CompilationContext, ty?: string): void {
  const {properties, items} = it.schema
  if (ty === "object" && properties) {
    for (const key in properties) {
      assignDefault(it, key, properties[key].default)
    }
  } else if (ty === "array" && Array.isArray(items)) {
    items.forEach((sch, i: number) => assignDefault(it, i, sch.default))
  }
}

function assignDefault(
  {gen, compositeRule, data, opts, logger}: CompilationContext,
  prop: string | number,
  defaultValue: any
): void {
  if (defaultValue === undefined) return
  const childData = _`${data}${getProperty(prop)}`
  if (compositeRule) {
    if (opts.strictDefaults) {
      const msg = `default is ignored for: ${childData}`
      if (opts.strictDefaults === "log") logger.warn(msg)
      else throw new Error(msg)
    }
    return
  }

  const condition =
    `${childData} === undefined` +
    (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
  gen.if(condition, `${childData} = ${JSON.stringify(defaultValue)}`)
}
