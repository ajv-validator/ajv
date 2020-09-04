"use strict"

var Ajv = require("../ajv")
require("../chai").should()

describe("issue #259, support validating [meta-]schemas against themselves", () => {
  it('should add schema before validation if "id" is the same as "$schema"', () => {
    var ajv = new Ajv({strict: false})
    var hyperSchema = require("../remotes/hyper-schema.json")
    ajv.addMetaSchema(hyperSchema)
  })
})
