import commonjs from "@rollup/plugin-commonjs"
import {nodeResolve} from "@rollup/plugin-node-resolve"
import json from "@rollup/plugin-json"
import typescript from "@rollup/plugin-typescript"
import {terser} from "rollup-plugin-terser"

function createBundleConfig(sourceFile, outFile, globalName) {
  return {
    input: `./lib/${sourceFile}.ts`,
    output: [
      {
        file: `./bundle/${outFile}.bundle.js`,
        format: "umd",
        name: globalName,
      },
      {
        file: `./bundle/${outFile}.min.js`,
        format: "umd",
        name: globalName,
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [commonjs(), nodeResolve(), json(), typescript()],
  }
}

export default [
  createBundleConfig("ajv", "ajv7", "ajv7"),
  createBundleConfig("2019", "ajv2019", "ajv2019"),
  createBundleConfig("2020", "ajv2020", "ajv2020"),
  createBundleConfig("jtd", "ajvJTD", "ajvJTD"),
]
