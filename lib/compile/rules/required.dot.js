var valid = true, missing = '';
var req_schema = validate.schema{{= it.schemaPath + '.required' }};

for (var i = 0; i < req_schema.length; i++) {
  var property = req_schema[i]
    , has = data.hasOwnProperty(req_schema[i])
    , valid = valid && has;

  if (!has) {
    {{? it.opts.allErrors }}
      missing += ', ' + property;
    {{??}}
      missing = property;
      break;
    {{?}}
  }
}

{{? it.opts.allErrors }}
  missing = missing.slice(2);
{{?}}

var result = {
  valid: valid,
  errors: valid ? [] : [{
    keyword: 'required',
    schema: req_schema,
    dataPath: dataPath,
    message: 'properties ' + missing + ' are missing'
    {{? it.opts.verbose }}, data: data{{?}}
  }]
};
