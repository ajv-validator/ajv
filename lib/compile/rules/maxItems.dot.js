var valid = data.length <= {{= it.schema.maxItems }};

if (!valid) validate.errors.push({
  keyword: 'maxItems',
  dataPath: dataPath,
  message: 'should NOT have more than {{= it.schema.maxItems }} items'
  {{? it.opts.verbose }}, schema: {{= it.schema.maxItems }}, data: data{{?}}
});
