import type {Options} from ".."

const isBrowser = typeof window == "object"
const fullTest = !isBrowser && process.env.AJV_FULL_TEST

const options: Options = fullTest
  ? {
      allErrors: true,
      verbose: true,
      inlineRefs: false,
      code: {es5: true, lines: true},
    }
  : {allErrors: true, code: {es5: true, lines: true}}

export default options

module.exports = options
