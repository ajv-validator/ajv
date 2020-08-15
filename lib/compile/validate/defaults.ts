import {CompilationContext} from "../../types"
import {getProperty} from "../util"

export function assignDefaults(it: CompilationContext, group) {
  const {properties, items} = it.schema
  if (group.type === "object" && properties) {
    for (const key in properties) {
      assignDefault(it, key, properties[key].default)
    }
  } else if (group.type === "array" && Array.isArray(items)) {
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
) {
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

  let condition =
    `${data} === undefined` +
    (useDefaults === "empty" ? ` || ${data} === null || ${data} === ""` : "")
  // TODO remove option `useDefaults === "shared"`
  const defaultExpr = useDefaults === "shared" ? useDefault : JSON.stringify
  gen.code(`if (${condition}) ${data} = ${defaultExpr(defaultValue)};`)
}
