var propertiesNum = Object.keys(data).length;
var valid = propertiesNum <= {{= it.schema.maxProperties }};

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'maxProperties',
    schema: {{= it.schema.maxProperties }},
    dataPath: dataPath,
    message: 'should NOT have more than {{= it.schema.maxProperties }} properties'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
