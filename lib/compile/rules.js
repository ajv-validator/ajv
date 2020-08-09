var ruleModules = require("../dotjs"),
  toHash = require("./util").toHash

module.exports = function rules() {
  var RULES = [
    {
      type: "number",
      rules: ["multipleOf", "format"],
    },
    {type: "string", rules: ["pattern", "format"]},
    {
      type: "array",
      rules: ["items", "contains", "uniqueItems"],
    },
    {
      type: "object",
      rules: [
        "required",
        "dependencies",
        "propertyNames",
        {properties: ["additionalProperties", "patternProperties"]},
      ],
    },
    {rules: ["$ref", "enum", "not", "anyOf", "oneOf", "allOf", "if"]},
  ]

  var ALL = ["type", "$comment"]
  var KEYWORDS = [
    "$schema",
    "$id",
    "id",
    "$data",
    "$async",
    "title",
    "description",
    "default",
    "definitions",
    "examples",
    "readOnly",
    "writeOnly",
    "contentMediaType",
    "contentEncoding",
    "additionalItems",
    "then",
    "else",
  ]
  var TYPES = [
    "number",
    "integer",
    "string",
    "array",
    "object",
    "boolean",
    "null",
  ]
  RULES.all = toHash(ALL)
  RULES.types = toHash(TYPES)

  RULES.forEach(function (group) {
    group.rules = group.rules.map(function (keyword) {
      var implKeywords
      if (typeof keyword == "object") {
        var key = Object.keys(keyword)[0]
        implKeywords = keyword[key]
        keyword = key
        implKeywords.forEach(function (k) {
          ALL.push(k)
          RULES.all[k] = true
        })
      }
      ALL.push(keyword)
      var rule = (RULES.all[keyword] = {
        keyword: keyword,
        code: ruleModules[keyword],
        implements: implKeywords,
      })
      return rule
    })

    RULES.all.$comment = {
      keyword: "$comment",
      code: ruleModules.$comment,
    }

    if (group.type) RULES.types[group.type] = group
  })

  RULES.keywords = toHash(ALL.concat(KEYWORDS))
  RULES.custom = {}

  return RULES
}
