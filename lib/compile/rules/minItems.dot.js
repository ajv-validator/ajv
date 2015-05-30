var valid = data.length >= {{= it.schema.minItems }};

if (!valid) validate.errors.push({
  keyword: 'minItems',
  dataPath: dataPath,
  message: 'should NOT have less than {{= it.schema.minItems }} items'
  {{? it.opts.verbose }}, schema: {{= it.schema.minItems }}, data: data{{?}}
});
