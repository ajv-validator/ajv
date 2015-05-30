var valid = data.length >= {{= it.schema.minLength }};

if (!valid) validate.errors.push({
  keyword: 'minLength',
  dataPath: dataPath,
  message: 'should NOT be shorter than {{= it.schema.minLength }} characters'
  {{? it.opts.verbose }}, schema: {{= it.schema.minLength }}, data: data{{?}}
});
