"use strict"

const testSuiteConfig = {
  draft6: "spec/JSON-Schema-Test-Suite/tests/draft6/",
  draft7: "spec/JSON-Schema-Test-Suite/tests/draft7/",
  draft2019: "spec/JSON-Schema-Test-Suite/tests/draft2019-09/",
  tests: "spec/tests/",
  security: "spec/security/",
  extras: "spec/extras/",
  async: "spec/async/",
  jtd: {path: "spec/json-typedef-spec/tests/", export: "object"},
}

const glob = require("glob")
const fs = require("fs")

for (const suite in testSuiteConfig) {
  const cfg = testSuiteConfig[suite]
  const isStr = typeof cfg == "string"
  const p = isStr ? cfg : cfg.path
  const exp = isStr ? "array" : cfg.export
  const files = glob.sync(`${p}{**/,}*.json`)
  if (files.length === 0) {
    console.error(`Missing folder ${p}\nTry: git submodule update --init\n`)
    process.exit(1)
  }
  const code = files
    .map((f) => {
      const name = f.replace(p, "").replace(/\.json$/, "")
      const testPath = f.replace(/^spec/, "..")
      return exp === "array"
        ? `\n  {name: "${name}", test: require("${testPath}")},`
        : `\n  ${name}: require("${testPath}"),`
    })
    .reduce((list, f) => list + f)
  const exportCode = exp === "array" ? `[${code}\n]` : `{${code}\n}`
  fs.writeFileSync(`./spec/_json/${suite}.js`, `module.exports = ${exportCode}\n`)
}
