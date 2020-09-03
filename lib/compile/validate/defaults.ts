import {CompilationContext} from "../../types"
import {_, getProperty, stringify} from "../codegen"

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
    if (opts.strict) {
      const msg = `default is ignored for: ${childData}`
      if (opts.strict === "log") logger.warn(msg)
      else throw new Error(msg)
    }
    return
  }

  let condition = _`${childData} === undefined`
  if (opts.useDefaults === "empty") {
    condition = _`${condition} || ${childData} === null || ${childData} === ""`
  }
  // `${childData} === undefined` +
  // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
  gen.if(condition, _`${childData} = ${stringify(defaultValue)}`)
}
