{{## def.setup:keyword:
  {{ 
    var $lvl = it.level
      , $dataLvl = it.dataLevel
      , $schema = it.schema[keyword]
      , $schemaPath = it.schemaPath + '.' + keyword;
  }}
#}}


{{## def.setupNextLevel:
  {{
    var $it = it.copy(it)
      , $closingBraces = ''
      , $breakOnError = !it.opts.allErrors;
    $it.level++;
  }}
#}}


{{## def.ifValid:
  {{? $breakOnError }}
    if (valid) {
    {{ $closingBraces += '}'; }}
  {{?}}
#}}


{{## def.elseIfValid:
  {{? $breakOnError }}
    {{ $closingBraces += '}'; }}
    else {
  {{?}}
#}}


{{## def.cleanUp:
  {{ out = out.replace(/if \(valid\) \{\s*\}/g, ''); }}
#}}


{{## def.error:keyword:
  validate.errors.push({
    keyword: '{{=keyword}}',
    dataPath: dataPath{{=$dataLvl}},
    message: {{# def._errorMessages[keyword] }}
    {{? it.opts.verbose }}, schema: {{# def._errorSchemas[keyword] }}, data: data{{=$dataLvl}}{{?}}
  });
#}}


{{## def.checkError:keyword:
  if (!valid) {{# def.error:keyword }}
#}}


{{## def._errorMessages = {
  $ref:            "'can\\\'t resolve reference {{=$schema}}'",
  additionalItems: "'should NOT have more than {{=$schema.length}} items'",
  additionalProperties: "'additional properties NOT allowed'",
  dependencies:    "'{{? $deps.length == 1 }}property {{= $deps[0] }} is{{??}}properties {{= $deps.join(\", \") }} are{{?}} required when property {{= $property }} is present'",
  enum:            "'should be equal to one of values'",
  format:          "'should match format {{=$schema}}'",
  maximum:         "'should be {{=$op}} {{=$schema}}'",
  minimum:         "'should be {{=$op}} {{=$schema}}'",
  maxItems:        "'should NOT have more than {{=$schema}} items'",
  minItems:        "'should NOT have less than {{=$schema}} items'",
  maxLength:       "'should NOT be longer than {{=$schema}} characters'",
  minLength:       "'should NOT be shorter than {{=$schema}} characters'",
  maxProperties:   "'should NOT have more than {{=$schema}} properties'",
  minProperties:   "'should NOT have less than {{=$schema}} properties'",
  multipleOf:      "'should be multiple of {{=$schema}}'",
  not:             "'should NOT be valid'",
  oneOf:           "'should match exactly one schema in oneOf'",
  pattern:         "'should match pattern \"{{=$schema}}\"'",
  required:        "'properties {{=$schema.slice(0,7).join(\", \") }}{{? $schema.length > 7}}...{{?}} are required'",
  type:            "'should be {{? $isArray }}{{= $schema.join(\",\") }}{{??}}{{=$schema}}{{?}}'",
  uniqueItems:     "'items ## ' + j{{=$lvl}} + ' and ' + i{{=$lvl}} + ' are duplicate'"
} #}}


{{## def._errorSchemas = {
  $ref:            "'{{=$schema}}'",
  additionalItems: "false",
  additionalProperties: "false",
  dependencies:    "validate.schema{{=$schemaPath}}",
  enum:            "validate.schema{{=$schemaPath}}",
  format:          "'{{=$schema}}'",
  maximum:         "{{=$schema}}",
  minimum:         "{{=$schema}}",
  maxItems:        "{{=$schema}}",
  minItems:        "{{=$schema}}",
  maxLength:       "{{=$schema}}",
  minLength:       "{{=$schema}}",
  maxProperties:   "{{=$schema}}",
  minProperties:   "{{=$schema}}",
  multipleOf:      "{{=$schema}}",
  not:             "validate.schema{{=$schemaPath}}",
  oneOf:           "validate.schema{{=$schemaPath}}",
  pattern:         "'{{=$schema}}'",
  required:        "validate.schema{{=$schemaPath}}",
  type:            "{{? $isArray }}validate.schema{{=$schemaPath}}{{??}}'{{=$schema}}'{{?}}",
  uniqueItems:     "{{=$schema}}"
} #}}
