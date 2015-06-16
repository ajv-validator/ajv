{{## def.setup:_keyword:
  {{ 
    var $lvl = it.level
      , $dataLvl = it.dataLevel
      , $schema = it.schema[_keyword]
      , $schemaPath = it.schemaPath + '.' + _keyword
      , $breakOnError = !it.opts.allErrors;


    var $data = 'data' + ($dataLvl || '')
      , $valid = 'valid' + $lvl
      , $errs = 'errs' + $lvl;
  }}
  {{? it.opts._debug }}
    console.log('Keyword {{= _keyword }}');
  {{?}}
#}}


{{## def.setupNextLevel:
  {{
    var $it = it.util.copy(it)
      , $closingBraces = '';
    $it.level++;
  }}
#}}


{{## def.ifValid:
  {{? $breakOnError }}
    if ({{=$valid}}) {
    {{ $closingBraces += '}'; }}
  {{?}}
#}}


{{## def.ifResultValid:
  {{? $breakOnError }}
    if (valid{{=$it.level}}) {
    {{ $closingBraces += '}'; }}
  {{?}}
#}}


{{## def.elseIfValid:
  {{? $breakOnError }}
    {{ $closingBraces += '}'; }}
    else {
  {{?}}
#}}


{{## def.nonEmptySchema:_schema:
  it.util.schemaHasRules(_schema, it.RULES.all)
#}}


{{## def.strLength:
  {{? it.opts.unicode === false }}
    {{=$data}}.length
  {{??}}
    ucs2length({{=$data}})
  {{?}}
#}}


{{## def.willOptimize:
  it.util.varOccurences($code, $nextData) < 2
#}}


{{## def._optimizeValidate:
  it.util.varReplace($code, $nextData, $passData)
#}}


{{## def.optimizeValidate:
  {{? {{# def.willOptimize}} }}
    {{= {{# def._optimizeValidate }} }}
  {{??}}
    var {{=$nextData}} = {{=$passData}};
    {{= $code }}
  {{?}}
#}}


{{## def.cleanUp: {{ out = it.util.cleanUpCode(out); }} #}}


{{## def.cleanUpVarErrors: {{ out = it.util.cleanUpVarErrors(out); }} #}}


{{## def._error:_rule:
  {
    keyword: '{{=_rule}}',
    dataPath: (dataPath || '') + {{= it.errorPath }},
    message: {{# def._errorMessages[_rule] }}
    {{? it.opts.verbose }}, schema: {{# def._errorSchemas[_rule] }}, data: {{=$data}}{{?}}
  }
#}}


{{## def.error:_rule:
  {{? it.wasTop && $breakOnError }}
    validate.errors = [{{# def._error:_rule }}];
    return false;
  {{??}}
    var err = {{# def._error:_rule }};
    if (validate.errors === null) validate.errors = [err];
    else validate.errors.push(err);
    errors++;
  {{?}}
#}}


{{## def.checkError:_rule:
  if (!{{=$valid}}) {
    {{# def.error:_rule }}
  }
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
  type:            "'should be {{? $isArray }}{{= $typeSchema.join(\",\") }}{{??}}{{=$typeSchema}}{{?}}'",
  uniqueItems:     "'items ## ' + j + ' and ' + i + ' are duplicate'"
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
  type:            "{{? $isArray }}validate.schema{{=$schemaPath}}{{??}}'{{=$typeSchema}}'{{?}}",
  uniqueItems:     "{{=$schema}}"
} #}}
