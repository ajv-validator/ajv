var propertiesNum = Object.keys(data).length;
var valid = propertiesNum <= {{= it.schema.maxProperties }};

if (!valid) validate.errors.push({
  keyword: 'maxProperties',
  schema: {{= it.schema.maxProperties }},
  dataPath: dataPath,
  message: 'should NOT have more than {{= it.schema.maxProperties }} properties'
  {{? it.opts.verbose }}, data: data{{?}}
});
