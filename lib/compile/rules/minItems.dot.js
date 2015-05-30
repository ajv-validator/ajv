var valid = data.length >= {{= it.schema.minItems }};

if (!valid) validate.errors.push({
  keyword: 'minItems',
  schema: {{= it.schema.minItems }},
  dataPath: dataPath,
  message: 'should NOT have less than {{= it.schema.minItems }} items'
  {{? it.opts.verbose }}, data: data{{?}}
});
