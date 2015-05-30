{{ 
  var $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

var valid = data {{= $op }} {{= it.schema.maximum }};

if (!valid) validate.errors.push({
  keyword: 'maximum',
  dataPath: dataPath,
  message: 'should be {{= $op }} {{= it.schema.maximum }}'
  {{? it.opts.verbose }}, schema: {{= it.schema.maximum }}, data: data{{?}}
});
