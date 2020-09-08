import type {Options} from "../dist/types"

const isBrowser = typeof window == "object"
const fullTest = !isBrowser && process.env.AJV_FULL_TEST

const options: Options = fullTest
  ? {
      allErrors: true,
      verbose: true,
      extendRefs: "ignore",
      inlineRefs: false,
      codegen: {es5: true, lines: true},
    }
  : {allErrors: true, codegen: {es5: true, lines: true}}

export default options

module.exports = options
