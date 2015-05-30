{{ 
  var $schema = it.schema.maximum
    , $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

var valid = data {{= $op }} {{= $schema }};
var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'maximum',
    schema: {{= $schema }},
    dataPath: dataPath,
    message: 'should be {{= $op }} {{= $schema }}'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
