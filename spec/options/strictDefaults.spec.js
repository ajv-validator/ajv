"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("strictDefaults option", () => {
  describe("useDefaults = true", () => {
    describe("strictDefaults = false", () => {
      it("should NOT throw an error or log a warning given an ignored default", () => {
        var output = {}
        var ajv = new Ajv({
          useDefaults: true,
          strictDefaults: false,
          logger: getLogger(output),
        })
        var schema = {
          default: 5,
          properties: {},
        }

        ajv.compile(schema)
        should.not.exist(output.warning)
      })

      it("should NOT throw an error or log a warning given an ignored default", () => {
        var output = {}
        var ajv = new Ajv({
          useDefaults: true,
          strictDefaults: false,
          logger: getLogger(output),
        })
        var schema = {
          oneOf: [
            {enum: ["foo", "bar"]},
            {
              properties: {
                foo: {
                  default: true,
                },
              },
            },
          ],
        }

        ajv.compile(schema)
        should.not.exist(output.warning)
      })
    })

    describe("strictDefaults = true", () => {
      it("should throw an error given an ignored default in the schema root when strictDefaults is true", () => {
        var ajv = new Ajv({useDefaults: true, strictDefaults: true})
        var schema = {
          default: 5,
          properties: {},
        }
        should.throw(() => {
          ajv.compile(schema)
        })
      })

      it("should throw an error given an ignored default in oneOf when strictDefaults is true", () => {
        var ajv = new Ajv({useDefaults: true, strictDefaults: true})
        var schema = {
          oneOf: [
            {enum: ["foo", "bar"]},
            {
              properties: {
                foo: {
                  default: true,
                },
              },
            },
          ],
        }
        should.throw(() => {
          ajv.compile(schema)
        })
      })
    })

    describe('strictDefaults = "log"', () => {
      it('should log a warning given an ignored default in the schema root when strictDefaults is "log"', () => {
        var output = {}
        var ajv = new Ajv({
          useDefaults: true,
          strictDefaults: "log",
          logger: getLogger(output),
        })
        var schema = {
          default: 5,
          properties: {},
        }
        ajv.compile(schema)
        should.equal(output.warning, "default is ignored in the schema root")
      })

      it('should log a warning given an ignored default in oneOf when strictDefaults is "log"', () => {
        var output = {}
        var ajv = new Ajv({
          useDefaults: true,
          strictDefaults: "log",
          logger: getLogger(output),
        })
        var schema = {
          oneOf: [
            {enum: ["foo", "bar"]},
            {
              properties: {
                foo: {
                  default: true,
                },
              },
            },
          ],
        }
        ajv.compile(schema)
        should.equal(output.warning, "default is ignored for: data.foo")
      })
    })
  })

  describe("useDefaults = false", () => {
    describe("strictDefaults = true", () => {
      it("should NOT throw an error given an ignored default in the schema root when useDefaults is false", () => {
        var ajv = new Ajv({useDefaults: false, strictDefaults: true})
        var schema = {
          default: 5,
          properties: {},
        }
        should.not.throw(() => {
          ajv.compile(schema)
        })
      })

      it("should NOT throw an error given an ignored default in oneOf when useDefaults is false", () => {
        var ajv = new Ajv({useDefaults: false, strictDefaults: true})
        var schema = {
          oneOf: [
            {enum: ["foo", "bar"]},
            {
              properties: {
                foo: {
                  default: true,
                },
              },
            },
          ],
        }
        should.not.throw(() => {
          ajv.compile(schema)
        })
      })
    })
  })

  function getLogger(output) {
    return {
      log: () => {
        throw new Error("log should not be called")
      },
      warn: function (warning) {
        output.warning = warning
      },
      error: () => {
        throw new Error("error should not be called")
      },
    }
  }
})
