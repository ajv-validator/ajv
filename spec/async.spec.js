"use strict"

var Ajv = require("./ajv"),
  should = require("./chai").should()

describe("compileAsync method", () => {
  var ajv, loadCallCount

  var SCHEMAS = {
    "http://example.com/object.json": {
      $id: "http://example.com/object.json",
      properties: {
        a: {type: "string"},
        b: {$ref: "int2plus.json"},
      },
    },
    "http://example.com/int2plus.json": {
      $id: "http://example.com/int2plus.json",
      type: "integer",
      minimum: 2,
    },
    "http://example.com/tree.json": {
      $id: "http://example.com/tree.json",
      type: "array",
      items: {$ref: "leaf.json"},
    },
    "http://example.com/leaf.json": {
      $id: "http://example.com/leaf.json",
      properties: {
        name: {type: "string"},
        subtree: {$ref: "tree.json"},
      },
    },
    "http://example.com/recursive.json": {
      $id: "http://example.com/recursive.json",
      properties: {
        b: {$ref: "parent.json"},
      },
      required: ["b"],
    },
    "http://example.com/invalid.json": {
      $id: "http://example.com/recursive.json",
      properties: {
        invalid: {type: "number"},
      },
      required: "invalid",
    },
    "http://example.com/foobar.json": {
      $id: "http://example.com/foobar.json",
      $schema: "http://example.com/foobar_meta.json",
      myFooBar: "foo",
    },
    "http://example.com/foobar_meta.json": {
      $id: "http://example.com/foobar_meta.json",
      type: "object",
      properties: {
        myFooBar: {
          enum: ["foo", "bar"],
        },
      },
    },
    "http://example.com/foo.json": {
      $id: "http://example.com/foo.json",
      type: "object",
      properties: {
        bar: {$ref: "bar.json"},
        other: {$ref: "other.json"},
      },
    },
    "http://example.com/bar.json": {
      $id: "http://example.com/bar.json",
      type: "object",
      properties: {
        foo: {$ref: "foo.json"},
      },
    },
    "http://example.com/other.json": {
      $id: "http://example.com/other.json",
    },
  }

  beforeEach(() => {
    loadCallCount = 0
    ajv = new Ajv({loadSchema: loadSchema})
  })

  it("should compile schemas loading missing schemas with options.loadSchema function", () => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {$ref: "object.json"},
      },
    }
    return ajv.compileAsync(schema).then((validate) => {
      should.equal(loadCallCount, 2)
      validate.should.be.a("function")
      validate({a: {b: 2}}).should.equal(true)
      validate({a: {b: 1}}).should.equal(false)
    })
  })

  it("should compile schemas loading missing schemas and return function via callback", (done) => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {$ref: "object.json"},
      },
    }
    ajv.compileAsync(schema, (err, validate) => {
      should.equal(loadCallCount, 2)
      should.not.exist(err)
      validate.should.be.a("function")
      validate({a: {b: 2}}).should.equal(true)
      validate({a: {b: 1}}).should.equal(false)
      done()
    })
  })

  it("should correctly load schemas when missing reference has JSON path", () => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {$ref: "object.json#/properties/b"},
      },
    }
    return ajv.compileAsync(schema).then((validate) => {
      should.equal(loadCallCount, 2)
      validate.should.be.a("function")
      validate({a: 2}).should.equal(true)
      validate({a: 1}).should.equal(false)
    })
  })

  it("should correctly compile with remote schemas that have mutual references", () => {
    var schema = {
      $id: "http://example.com/root.json",
      properties: {
        tree: {$ref: "tree.json"},
      },
    }
    return ajv.compileAsync(schema).then((validate) => {
      validate.should.be.a("function")
      var validData = {
        tree: [{name: "a", subtree: [{name: "a.a"}]}, {name: "b"}],
      }
      var invalidData = {tree: [{name: "a", subtree: [{name: 1}]}]}
      validate(validData).should.equal(true)
      validate(invalidData).should.equal(false)
    })
  })

  it("should correctly compile with remote schemas that reference the compiled schema", () => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {$ref: "recursive.json"},
      },
    }
    return ajv.compileAsync(schema).then((validate) => {
      should.equal(loadCallCount, 1)
      validate.should.be.a("function")
      var validData = {a: {b: {a: {b: {}}}}}
      var invalidData = {a: {b: {a: {}}}}
      validate(validData).should.equal(true)
      validate(invalidData).should.equal(false)
    })
  })

  it('should resolve reference containing "properties" segment with the same property (issue #220)', () => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {
          $ref: "object.json#/properties/a",
        },
      },
    }
    return ajv.compileAsync(schema).then((validate) => {
      should.equal(loadCallCount, 2)
      validate.should.be.a("function")
      validate({a: "foo"}).should.equal(true)
      validate({a: 42}).should.equal(false)
    })
  })

  describe("loading metaschemas (#334)", () => {
    it("should load metaschema if not available", () => {
      return test(SCHEMAS["http://example.com/foobar.json"], 1)
    })

    it("should load metaschema of referenced schema if not available", () => {
      return test({$ref: "http://example.com/foobar.json"}, 2)
    })

    function test(schema, expectedLoadCallCount) {
      ajv.addKeyword("myFooBar", {
        type: "string",
        validate: function (sch, data) {
          return sch == data
        },
      })

      return ajv.compileAsync(schema).then((validate) => {
        should.equal(loadCallCount, expectedLoadCallCount)
        validate.should.be.a("function")
        validate("foo").should.equal(true)
        validate("bar").should.equal(false)
      })
    }
  })

  it("should return compiled schema on the next tick if there are no references (#51)", () => {
    var schema = {
      $id: "http://example.com/int2plus.json",
      type: "integer",
      minimum: 2,
    }
    var beforeCallback1
    var p1 = ajv.compileAsync(schema).then((validate) => {
      beforeCallback1.should.equal(true)
      spec(validate)
      var beforeCallback2
      var p2 = ajv.compileAsync(schema).then((_validate) => {
        beforeCallback2.should.equal(true)
        spec(_validate)
      })
      beforeCallback2 = true
      return p2
    })
    beforeCallback1 = true
    return p1

    function spec(validate) {
      should.equal(loadCallCount, 0)
      validate.should.be.a("function")
      var validData = 2
      var invalidData = 1
      validate(validData).should.equal(true)
      validate(invalidData).should.equal(false)
    }
  })

  it("should queue calls so only one compileAsync executes at a time (#52)", () => {
    var schema = {
      $id: "http://example.com/parent.json",
      properties: {
        a: {$ref: "object.json"},
      },
    }

    return Promise.all([
      ajv.compileAsync(schema).then(spec),
      ajv.compileAsync(schema).then(spec),
      ajv.compileAsync(schema).then(spec),
    ])

    function spec(validate) {
      should.equal(loadCallCount, 2)
      validate.should.be.a("function")
      validate({a: {b: 2}}).should.equal(true)
      validate({a: {b: 1}}).should.equal(false)
    }
  })

  it("should throw exception if loadSchema is not passed", (done) => {
    var schema = {
      $id: "http://example.com/int2plus.json",
      type: "integer",
      minimum: 2,
    }
    ajv = new Ajv()
    should.throw(() => {
      ajv.compileAsync(schema, () => {
        done(new Error("it should have thrown exception"))
      })
    })
    setTimeout(() => {
      // function is needed for the test to pass in Firefox 4
      done()
    })
  })

  describe("should return error via callback", () => {
    it("if passed schema is invalid", (done) => {
      var invalidSchema = {
        $id: "http://example.com/int2plus.json",
        type: "integer",
        minimum: "invalid",
      }
      ajv.compileAsync(invalidSchema, shouldFail(done))
    })

    it("if loaded schema is invalid", (done) => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "invalid.json"},
        },
      }
      ajv.compileAsync(schema, shouldFail(done))
    })

    it("if required schema is loaded but the reference cannot be resolved", (done) => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "object.json#/definitions/not_found"},
        },
      }
      ajv.compileAsync(schema, shouldFail(done))
    })

    it("if loadSchema returned error", (done) => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "object.json"},
        },
      }
      ajv = new Ajv({loadSchema: badLoadSchema})
      ajv.compileAsync(schema, shouldFail(done))

      function badLoadSchema() {
        return Promise.reject(new Error("cant load"))
      }
    })

    it("if schema compilation throws some other exception", (done) => {
      ajv.addKeyword("badkeyword", {compile: badCompile})
      var schema = {badkeyword: true}
      ajv.compileAsync(schema, shouldFail(done))

      function badCompile(/* schema */) {
        throw new Error("cant compile keyword schema")
      }
    })

    function shouldFail(done) {
      return (err, validate) => {
        should.exist(err)
        should.not.exist(validate)
        done()
      }
    }
  })

  describe("should return error via promise", () => {
    it("if passed schema is invalid", () => {
      var invalidSchema = {
        $id: "http://example.com/int2plus.json",
        type: "integer",
        minimum: "invalid",
      }
      return shouldReject(ajv.compileAsync(invalidSchema))
    })

    it("if loaded schema is invalid", () => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "invalid.json"},
        },
      }
      return shouldReject(ajv.compileAsync(schema))
    })

    it("if required schema is loaded but the reference cannot be resolved", () => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "object.json#/definitions/not_found"},
        },
      }
      return shouldReject(ajv.compileAsync(schema))
    })

    it("if loadSchema returned error", () => {
      var schema = {
        $id: "http://example.com/parent.json",
        properties: {
          a: {$ref: "object.json"},
        },
      }
      ajv = new Ajv({loadSchema: badLoadSchema})
      return shouldReject(ajv.compileAsync(schema))

      function badLoadSchema() {
        return Promise.reject(new Error("cant load"))
      }
    })

    it("if schema compilation throws some other exception", () => {
      ajv.addKeyword("badkeyword", {compile: badCompile})
      var schema = {badkeyword: true}
      return shouldReject(ajv.compileAsync(schema))

      function badCompile(/* schema */) {
        throw new Error("cant compile keyword schema")
      }
    })

    function shouldReject(p) {
      return p.then(
        (validate) => {
          should.not.exist(validate)
          throw new Error("Promise has resolved; it should have rejected")
        },
        (err) => should.exist(err)
      )
    }
  })

  describe("schema with multiple remote properties, the first is recursive schema (#801)", () => {
    it("should validate data", () => {
      var schema = {
        $id: "http://example.com/list.json",
        type: "object",
        properties: {
          foo: {$ref: "foo.json"},
        },
      }

      return ajv.compileAsync(schema).then((validate) => {
        validate({foo: {}}).should.equal(true)
      })
    })
  })

  function loadSchema(uri) {
    loadCallCount++
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (SCHEMAS[uri]) resolve(SCHEMAS[uri])
        else reject(new Error("404"))
      }, 10)
    })
  }
})
