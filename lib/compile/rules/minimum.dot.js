{{
  var $exclusive = it.schema.exclusiveMinimum === true
    , $op = $exclusive ? '>' : '>=';
}}

var valid = data {{= $op }} {{= it.schema.minimum }};

if (!valid) validate.errors.push({
  keyword: 'minimum',
  schema: {{= it.schema.minimum }},
  dataPath: dataPath,
  message: 'should be {{= $op }} {{= it.schema.minimum }}'
  {{? it.opts.verbose }}, data: data{{?}}
});
