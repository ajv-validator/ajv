{{ 
  var $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

var valid = data {{= $op }} {{= it.schema.maximum }};

if (!valid) validate.errors.push({
  keyword: 'maximum',
  schema: {{= it.schema.maximum }},
  dataPath: dataPath,
  message: 'should be {{= $op }} {{= it.schema.maximum }}'
  {{? it.opts.verbose }}, data: data{{?}}
});
