var valid = data.length >= {{= it.schema.minLength }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'minLength',
    schema: {{= it.schema.minLength }},
    dataPath: dataPath,
    message: 'should NOT be shorter than {{= it.schema.minLength }} characters'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
