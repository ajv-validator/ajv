function (data, dataPath) {
  var foundValid = false
    , errs = validate.errors.length;

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var valid = ({{= it.validate($it) }})(data, dataPath);

    if (valid) {
      if (foundValid) {
        validate.errors.push({
          keyword: 'oneOf',
          dataPath: dataPath,
          message: 'should match exactly one schema in oneOf'
          {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath }}, data: data{{?}}
        });
        return false;
      }
      foundValid = true;
    }
  {{~}}

  if (foundValid) validate.errors.length = errs;
  else validate.errors.push({
    keyword: 'oneOf',
    dataPath: dataPath,
    message: 'should match exactly one schema in oneOf'
    {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath }}, data: data{{?}}
  });

  return foundValid;
}
