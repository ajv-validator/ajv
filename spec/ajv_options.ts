import type {Options} from ".."

const isBrowser = typeof window == "object"
const fullTest = !isBrowser && process.env.AJV_FULL_TEST

const codeOptions = {es5: true, lines: true, optimize: false}

const options: Options = fullTest
  ? {
      allErrors: true,
      verbose: true,
      inlineRefs: false,
      code: codeOptions,
    }
  : {allErrors: true, code: codeOptions}

export default options
