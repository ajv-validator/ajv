{{
  var $schema = it.schema.minimum 
    , $exclusive = it.schema.exclusiveMinimum === true
    , $op = $exclusive ? '>' : '>=';
}}

var valid = data {{= $op }} {{= $schema }};
var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'minimum',
    schema: {{= $schema }},
    dataPath: dataPath,
    message: 'should be {{= $op }} {{= $schema }}'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
