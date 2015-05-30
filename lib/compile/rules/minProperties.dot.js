var propertiesNum = Object.keys(data).length;
var valid = propertiesNum >= {{= it.schema.minProperties }};

if (!valid) validate.errors.push({
  keyword: 'minProperties',
  schema: {{= it.schema.minProperties }},
  dataPath: dataPath,
  message: 'should NOT have less than {{= it.schema.minProperties }} properties'
  {{? it.opts.verbose }}, data: data{{?}}
});
