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

if (!valid) validate.errors.push({
  keyword: 'required',
  dataPath: dataPath,
  message: 'properties ' + missing + ' are missing'
  {{? it.opts.verbose }}, schema: req_schema, data: data{{?}}
});
