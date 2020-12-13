import getAjvAsyncInstances from "./ajv_async_instances"
import jsonSchemaTest = require("json-schema-test")
import {afterError} from "./after_test"
import type Ajv from ".."
import _Ajv from "./ajv"
import chai from "./chai"

const instances = getAjvAsyncInstances({$data: true})

instances.forEach(addAsyncFormatsAndKeywords)

jsonSchemaTest(instances, {
  description:
    "asynchronous schemas tests of " + instances.length + " ajv instances with different options",
  suites: {"async schemas": require("./_json/async")},
  async: true,
  asyncValid: "data",
  assert: chai.assert,
  afterError,
  // afterEach: after.each,
  cwd: __dirname,
  hideFolder: "async/",
  timeout: 10000,
})

function addAsyncFormatsAndKeywords(ajv: Ajv) {
  ajv.addFormat("date", /^\d\d\d\d-[0-1]\d-[0-3]\d$/)

  ajv.addFormat("english_word", {
    async: true,
    validate: checkWordOnServer,
  })

  ajv.addKeyword({
    keyword: "idExists",
    async: true,
    type: "number",
    validate: checkIdExists,
    errors: false,
  })

  ajv.addKeyword({
    keyword: "idExistsWithError",
    async: true,
    type: "number",
    validate: checkIdExistsWithError,
    errors: true,
  })

  ajv.addKeyword({
    keyword: "idExistsCompiled",
    async: true,
    type: "number",
    compile: compileCheckIdExists,
  })
}

function checkWordOnServer(str: string): Promise<boolean> {
  return str === "tomorrow"
    ? Promise.resolve(true)
    : str === "manana"
    ? Promise.resolve(false)
    : Promise.reject(new Error("unknown word"))
}

function checkIdExists(schema: {table: string}, data: number): Promise<boolean> {
  switch (schema.table) {
    case "users":
      return check([1, 5, 8])
    case "posts":
      return check([21, 25, 28])
    default:
      throw new Error("no such table")
  }

  function check(IDs: number[]): Promise<boolean> {
    return Promise.resolve(IDs.includes(data))
  }
}

function checkIdExistsWithError(schema: {table: string}, data: number): Promise<boolean> {
  const {table} = schema
  switch (table) {
    case "users":
      return check(table, [1, 5, 8])
    case "posts":
      return check(table, [21, 25, 28])
    default:
      throw new Error("no such table")
  }

  function check(_table: string, IDs: number[]): Promise<boolean> {
    if (IDs.includes(data)) return Promise.resolve(true)

    const error = {
      keyword: "idExistsWithError",
      message: "id not found in table " + _table,
    }
    return Promise.reject(new _Ajv.ValidationError([error]))
  }
}

function compileCheckIdExists(schema: {table: string}): (data: number) => Promise<boolean> {
  switch (schema.table) {
    case "users":
      return compileCheck([1, 5, 8])
    case "posts":
      return compileCheck([21, 25, 28])
    default:
      throw new Error("no such table")
  }

  function compileCheck(IDs: number[]): (data: number) => Promise<boolean> {
    return (data) => Promise.resolve(IDs.includes(data))
  }
}
