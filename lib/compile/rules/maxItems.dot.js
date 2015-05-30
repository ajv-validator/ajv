var valid = data.length <= {{= it.schema.maxItems }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'maxItems',
    schema: {{= it.schema.maxItems }},
    dataPath: dataPath,
    message: 'should NOT have more than {{= it.schema.maxItems }} items'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
