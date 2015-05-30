var valid = data.length <= {{= it.schema.maxLength }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'maxLength',
    schema: {{= it.schema.maxLength }},
    dataPath: dataPath,
    message: 'should NOT be longer than {{= it.schema.maxLength }} characters'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
