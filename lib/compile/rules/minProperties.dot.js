var propertiesNum = Object.keys(data).length;
var valid = propertiesNum >= {{= it.schema.minProperties }};

if (!valid) validate.errors.push({
  keyword: 'minProperties',
  dataPath: dataPath,
  message: 'should NOT have less than {{= it.schema.minProperties }} properties'
  {{? it.opts.verbose }}, schema: {{= it.schema.minProperties }}, data: data{{?}}
});
