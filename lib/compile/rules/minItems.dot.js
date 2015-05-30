var valid = data.length >= {{= it.schema.minItems }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'minItems',
    schema: {{= it.schema.minItems }},
    dataPath: dataPath,
    message: 'should NOT have less than {{= it.schema.minItems }} items'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
