var division = data / {{= it.schema.multipleOf }};
var valid = division === parseInt(division);

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'multipleOf',
    schema: {{= it.schema.multipleOf }},
    dataPath: dataPath,
    message: 'should be multiple of {{= it.schema.multipleOf }}'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
