/* eslint-disable no-empty */
/* eslint-disable no-console */
const Ajv = require("ajv/dist/jtd").default
const Benchmark = require("benchmark")
const jtdValidationTests = require("../spec/json-typedef-spec/tests/validation.json")

const ajv = new Ajv()
const suite = new Benchmark.Suite()
const tests = []

for (const testName in jtdValidationTests) {
  const {schema, instance, errors} = jtdValidationTests[testName]
  const valid = errors.length === 0
  if (!valid) continue
  tests.push({
    validate: ajv.compile(schema),
    serialize: ajv.compileSerializer(schema),
    parse: ajv.compileParser(schema),
    data: instance,
    json: JSON.stringify(instance),
  })
}

// suite.add("JTD test suite: compiled JTD serializers", () => {
//   for (const test of tests) {
//     test.serialize(test.data)
//   }
// })

// suite.add("JTD test suite: JSON.stringify", () => {
//   for (const test of tests) {
//     JSON.stringify(test.data)
//   }
// })

const testSchema = {
  definitions: {
    obj: {
      properties: {
        foo: {type: "string"},
        bar: {type: "int8"},
      },
    },
  },
  properties: {
    a: {ref: "obj"},
  },
  optionalProperties: {
    b: {ref: "obj"},
  },
}

const testData = {
  a: {
    foo: "foo1",
    bar: 1,
  },
  b: {
    foo: "foo2",
    bar: 2,
  },
}

// const serializer = ajv.compileSerializer(testSchema)

// suite.add("test data: compiled JTD serializer", () => serializer(testData))
// suite.add("test data: JSON.stringify", () => JSON.stringify(testData))

suite.add("JTD test suite: compiled JTD parsers", () => {
  for (const test of tests) {
    test.parse(test.json)
  }
})

suite.add("JTD test suite: JSON.parse", () => {
  for (const test of tests) {
    JSON.parse(test.json)
  }
})

suite.add("JTD test suite: JSON.parse + validate", () => {
  for (const test of tests) {
    JSON.parse(test.json)
  }
})

const validTestData = JSON.stringify(testData)

const invalidTestData = JSON.stringify({
  a: {
    foo: "foo1",
    bar: "1",
  },
  b: {
    foo: "foo2",
    bar: 2,
  },
})

const parse = ajv.compileParser(testSchema)
const validate = ajv.compile(testSchema)

suite.add("valid test data: compiled JTD parser", () => parse(validTestData))
suite.add("valid test data: JSON.parse", () => JSON.parse(validTestData))
suite.add("valid test data: JSON.parse + validate", () => validate(JSON.parse(validTestData)))
suite.add("invalid test data: compiled JTD parser", () => parse(invalidTestData))
suite.add("invalid test data: JSON.parse", () => JSON.parse(invalidTestData))
suite.add("invalid test data: JSON.parse + validate", () => validate(JSON.parse(invalidTestData)))

console.log()

suite
  .on("cycle", (event) => console.log(String(event.target)))
  .on("complete", function () {
    // eslint-disable-next-line no-invalid-this
    console.log('The fastest is "' + this.filter("fastest").map("name") + '"')
  })
  .run({async: true})
