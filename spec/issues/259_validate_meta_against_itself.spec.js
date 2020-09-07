"use strict"

const Ajv = require("../ajv")
require("../chai").should()

describe("issue #259, support validating [meta-]schemas against themselves", () => {
  it('should add schema before validation if "id" is the same as "$schema"', () => {
    const ajv = new Ajv({strict: false})
    const hyperSchema = require("../remotes/hyper-schema.json")
    ajv.addMetaSchema(hyperSchema)
  })
})
