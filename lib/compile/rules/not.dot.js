{{
  var $it = it.copy(it)
    , $level = it.level;
  $it.level++;
  $it.schema = it.schema.not;
  $it.schemaPath = it.schemaPath + '.not';
}}

var errs{{= $level }} = validate.errors.length;

var valid = ({{= it.validate($it) }})(data, dataPath);
valid = !valid;

if (valid) validate.errors.length = errs{{= $level }};
else validate.errors.push({
  keyword: 'not',
  dataPath: dataPath,
  message: 'should NOT be valid'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.not' }}, data: data{{?}}
});
