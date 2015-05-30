var valid = data.length <= {{= it.schema.maxLength }};

if (!valid) validate.errors.push({
  keyword: 'maxLength',
  schema: {{= it.schema.maxLength }},
  dataPath: dataPath,
  message: 'should NOT be longer than {{= it.schema.maxLength }} characters'
  {{? it.opts.verbose }}, data: data{{?}}
});
