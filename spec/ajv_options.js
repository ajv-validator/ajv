"use strict"

const isBrowser = typeof window == "object"
const fullTest = !isBrowser && process.env.AJV_FULL_TEST

const options = fullTest
  ? {
      allErrors: true,
      verbose: true,
      extendRefs: "ignore",
      inlineRefs: false,
      codegen: {es5: true, lines: true},
    }
  : {allErrors: true, codegen: {es5: true, lines: true}}

module.exports = options
