var division = data / {{= it.schema.multipleOf }};
var valid = division === parseInt(division);

if (!valid) validate.errors.push({
  keyword: 'multipleOf',
  dataPath: dataPath,
  message: 'should be multiple of {{= it.schema.multipleOf }}'
  {{? it.opts.verbose }}, schema: {{= it.schema.multipleOf }}, data: data{{?}}
});
