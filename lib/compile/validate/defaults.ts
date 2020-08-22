import {CompilationContext} from "../../types"
import {getProperty} from "../util"

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
  {
    gen,
    compositeRule,
    dataLevel,
    useDefault,
    opts: {strictDefaults, useDefaults},
    logger,
  }: CompilationContext,
  prop: string | number,
  defaultValue: any
): void {
  if (defaultValue === undefined) return
  // TODO refactor `data${dataLevel || ""}`
  const data = "data" + (dataLevel || "") + getProperty(prop)
  if (compositeRule) {
    if (strictDefaults) {
      const msg = `default is ignored for: ${data}`
      if (strictDefaults === "log") logger.warn(msg)
      else throw new Error(msg)
    }
    return
  }

  const condition =
    `${data} === undefined` +
    (useDefaults === "empty" ? ` || ${data} === null || ${data} === ""` : "")
  // TODO remove option `useDefaults === "shared"`
  const defaultExpr = useDefaults === "shared" ? useDefault : JSON.stringify
  gen.if(condition, `${data} = ${defaultExpr(defaultValue)}`)
}
