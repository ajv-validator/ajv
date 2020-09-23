import getAjvAsyncInstances from "./ajv_async_instances"
import _Ajv from "./ajv"
import chai from "./chai"
const should = chai.should()

describe("async schemas, formats and keywords", function () {
  this.timeout(30000)
  let ajv, instances

  beforeEach(() => {
    instances = getAjvAsyncInstances()
    ajv = instances[0]
  })

  describe("async schemas without async elements", () => {
    it("should return result as promise", () => {
      const schema = {
        $async: true,
        type: "string",
        maxLength: 3,
      }

      return repeat(() => {
        return Promise.all(instances.map(test))
      })

      function test(_ajv) {
        const validate = _ajv.compile(schema)

        return Promise.all([
          shouldBeValid(validate("abc"), "abc"),
          shouldBeInvalid(validate("abcd")),
          shouldBeInvalid(validate(1)),
        ])
      }
    })

    it("should fail compilation if async schema is inside sync schema", () => {
      const schema: any = {
        type: "object",
        properties: {
          foo: {
            $async: true,
            type: "string",
            maxLength: 3,
          },
        },
      }

      should.throw(() => {
        ajv.compile(schema)
      }, "async schema in sync schema")

      ajv.compile({...schema, $async: true})
    })
  })

  describe("async formats", () => {
    beforeEach(addFormatEnglishWord)

    it("should fail compilation if async format is inside sync schema", () => {
      instances.forEach((_ajv) => {
        let schema: any = {
          type: "string",
          format: "english_word",
        }

        should.throw(() => {
          _ajv.compile(schema)
        }, "async format in sync schema")
        schema = {...schema, $async: true}
        _ajv.compile(schema)
      })
    })
  })

  describe("async user-defined keywords", () => {
    beforeEach(() => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({
          keyword: "idExists",
          async: true,
          type: "number",
          validate: checkIdExists,
          errors: false,
        })

        _ajv.addKeyword({
          keyword: "idExistsWithError",
          async: true,
          type: "number",
          validate: checkIdExistsWithError,
          errors: true,
        })
      })
    })

    it("should fail compilation if async keyword is inside sync schema", () => {
      instances.forEach((_ajv) => {
        let schema: any = {
          type: "object",
          properties: {
            userId: {
              type: "integer",
              idExists: {table: "users"},
            },
          },
        }

        should.throw(() => {
          _ajv.compile(schema)
        }, "async keyword in sync schema")

        schema = {...schema, $async: true}
        _ajv.compile(schema)
      })
    })

    it("should return user-defined error", () => {
      return Promise.all(
        instances.map((_ajv) => {
          const schema = {
            $async: true,
            type: "object",
            properties: {
              userId: {
                type: "integer",
                idExistsWithError: {table: "users"},
              },
              postId: {
                type: "integer",
                idExistsWithError: {table: "posts"},
              },
            },
          }

          const validate = _ajv.compile(schema)

          return Promise.all([
            shouldBeInvalid(validate({userId: 5, postId: 10}), ["id not found in table posts"]),
            shouldBeInvalid(validate({userId: 9, postId: 25}), ["id not found in table users"]),
          ])
        })
      )
    })

    function checkIdExists(schema, data) {
      switch (schema.table) {
        case "users":
          return check([1, 5, 8])
        case "posts":
          return check([21, 25, 28])
        default:
          throw new Error("no such table")
      }

      function check(IDs) {
        return Promise.resolve(IDs.indexOf(data) >= 0)
      }
    }

    function checkIdExistsWithError(schema, data) {
      const {table} = schema
      switch (table) {
        case "users":
          return check(table, [1, 5, 8])
        case "posts":
          return check(table, [21, 25, 28])
        default:
          throw new Error("no such table")
      }

      function check(_table, IDs) {
        if (IDs.indexOf(data) >= 0) return Promise.resolve(true)
        const error = {
          keyword: "idExistsWithError",
          message: "id not found in table " + _table,
        }
        return Promise.reject(new _Ajv.ValidationError([error]))
      }
    }
  })

  describe("async referenced schemas", () => {
    beforeEach(() => {
      instances = getAjvAsyncInstances({inlineRefs: false, ignoreKeywordsWithRef: true})
      addFormatEnglishWord()
    })

    it("should validate referenced async schema", () => {
      const schema = {
        $async: true,
        definitions: {
          english_word: {
            $async: true,
            type: "string",
            format: "english_word",
          },
        },
        type: "object",
        properties: {
          word: {$ref: "#/definitions/english_word"},
        },
      }

      return repeat(() => {
        return Promise.all(
          instances.map((_ajv) => {
            const validate = _ajv.compile(schema)
            const validData = {word: "tomorrow"}

            return Promise.all([
              shouldBeValid(validate(validData), validData),
              shouldBeInvalid(validate({word: "manana"})),
              shouldBeInvalid(validate({word: 1})),
              shouldThrow(validate({word: "today"}), "unknown word"),
            ])
          })
        )
      })
    })

    it("should validate recursive async schema", () => {
      const schema = {
        $async: true,
        definitions: {
          english_word: {
            $async: true,
            type: "string",
            format: "english_word",
          },
        },
        type: "object",
        properties: {
          foo: {
            anyOf: [{$ref: "#/definitions/english_word"}, {$ref: "#"}],
          },
        },
      }

      return recursiveTest(schema)
    })

    it("should validate recursive ref to async sub-schema, issue #612", () => {
      const schema = {
        $async: true,
        type: "object",
        properties: {
          foo: {
            $async: true,
            anyOf: [
              {
                type: "string",
                format: "english_word",
              },
              {
                type: "object",
                properties: {
                  foo: {$ref: "#/properties/foo"},
                },
              },
            ],
          },
        },
      }

      return recursiveTest(schema)
    })

    it("should validate ref from referenced async schema to root schema", () => {
      const schema = {
        $async: true,
        definitions: {
          wordOrRoot: {
            $async: true,
            anyOf: [
              {
                type: "string",
                format: "english_word",
              },
              {$ref: "#"},
            ],
          },
        },
        type: "object",
        properties: {
          foo: {$ref: "#/definitions/wordOrRoot"},
        },
      }

      return recursiveTest(schema)
    })

    it("should validate refs between two async schemas", () => {
      const schemaObj = {
        $id: "http://e.com/obj.json#",
        $async: true,
        type: "object",
        properties: {
          foo: {$ref: "http://e.com/word.json#"},
        },
      }

      const schemaWord = {
        $id: "http://e.com/word.json#",
        $async: true,
        anyOf: [
          {
            type: "string",
            format: "english_word",
          },
          {$ref: "http://e.com/obj.json#"},
        ],
      }

      return recursiveTest(schemaObj, schemaWord)
    })

    it("should fail compilation if sync schema references async schema", () => {
      let schema: any = {
        $id: "http://e.com/obj.json#",
        type: "object",
        properties: {
          foo: {$ref: "http://e.com/word.json#"},
        },
      }

      const schemaWord = {
        $id: "http://e.com/word.json#",
        $async: true,
        anyOf: [
          {
            type: "string",
            format: "english_word",
          },
          {$ref: "http://e.com/obj.json#"},
        ],
      }

      ajv.addSchema(schemaWord)
      ajv.addFormat("english_word", {
        async: true,
        validate: checkWordOnServer,
      })

      should.throw(() => {
        ajv.compile(schema)
      }, "async schema referenced by sync schema")

      schema = {...schema, $id: "http://e.com/obj2.json#", $async: true}

      ajv.compile(schema)
    })

    function recursiveTest(schema, refSchema?) {
      return repeat(() => {
        return Promise.all(
          instances.map((_ajv) => {
            if (refSchema) _ajv.addSchema(refSchema)
            const validate = _ajv.compile(schema)
            let data

            return Promise.all([
              shouldBeValid(validate((data = {foo: "tomorrow"})), data),
              shouldBeInvalid(validate({foo: "manana"})),
              shouldBeInvalid(validate({foo: 1})),
              shouldThrow(validate({foo: "today"}), "unknown word"),
              shouldBeValid(validate((data = {foo: {foo: "tomorrow"}})), data),
              shouldBeInvalid(validate({foo: {foo: "manana"}})),
              shouldBeInvalid(validate({foo: {foo: 1}})),
              shouldThrow(validate({foo: {foo: "today"}}), "unknown word"),
              shouldBeValid(validate((data = {foo: {foo: {foo: "tomorrow"}}})), data),
              shouldBeInvalid(validate({foo: {foo: {foo: "manana"}}})),
              shouldBeInvalid(validate({foo: {foo: {foo: 1}}})),
              shouldThrow(validate({foo: {foo: {foo: "today"}}}), "unknown word"),
            ])
          })
        )
      })
    }
  })

  function addFormatEnglishWord() {
    instances.forEach((_ajv) => {
      _ajv.addFormat("english_word", {
        async: true,
        validate: checkWordOnServer,
      })
    })
  }
})

function checkWordOnServer(str) {
  return str === "tomorrow"
    ? Promise.resolve(true)
    : str === "manana"
    ? Promise.resolve(false)
    : Promise.reject(new Error("unknown word"))
}

function shouldBeValid(p, data) {
  return p.then((valid) => valid.should.equal(data))
}

const SHOULD_BE_INVALID = "test: should be invalid"
function shouldBeInvalid(p, expectedMessages?: string[]) {
  return checkNotValid(p).then((err) => {
    err.should.be.instanceof(_Ajv.ValidationError)
    err.errors.should.be.an("array")
    err.validation.should.equal(true)
    if (expectedMessages) {
      const messages = err.errors.map((e) => e.message)
      messages.should.eql(expectedMessages)
    }
  })
}

function shouldThrow(p, exception) {
  return checkNotValid(p).then((err) => err.message.should.equal(exception))
}

function checkNotValid(p) {
  return p
    .then((/* valid */) => {
      throw new Error(SHOULD_BE_INVALID)
    })
    .catch((err) => {
      err.should.be.instanceof(Error)
      if (err.message === SHOULD_BE_INVALID) throw err
      return err
    })
}

function repeat(func) {
  return func()
  // var promises = [];
  // for (var i=0; i<1000; i++) promises.push(func());
  // return Promise.all(promises);
}
