var not_errs = validate.errors.length;

{{
  var $it = it.copy(it);
  $it.schema = it.schema.not;
  $it.schemaPath = it.schemaPath + '.not';
}}

var valid = ({{= it.validate($it) }})(data, dataPath);
valid = !valid;

if (valid) validate.errors.length = not_errs;
else validate.errors.push({
  keyword: 'not',
  dataPath: dataPath,
  message: 'should NOT be valid'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.not' }}, data: data{{?}}
});
