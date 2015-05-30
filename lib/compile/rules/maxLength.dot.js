var valid = data.length <= {{= it.schema.maxLength }};

if (!valid) validate.errors.push({
  keyword: 'maxLength',
  dataPath: dataPath,
  message: 'should NOT be longer than {{= it.schema.maxLength }} characters'
  {{? it.opts.verbose }}, schema: {{= it.schema.maxLength }}, data: data{{?}}
});
