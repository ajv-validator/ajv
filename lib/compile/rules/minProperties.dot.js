var propertiesNum = Object.keys(data).length;
var valid = propertiesNum >= {{= it.schema.minProperties }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'minProperties',
    schema: {{= it.schema.minProperties }},
    dataPath: dataPath,
    message: 'should NOT have less than {{= it.schema.minProperties }} properties'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
