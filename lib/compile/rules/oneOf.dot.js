{{
  var $it = it.copy(it)
    , $level = it.level
    , $closingBraces = '';
  $it.level++;
}}

var errs{{= $level }} = validate.errors.length;
var validCount{{= $level }} = 0;

{{~ it.schema.oneOf:$schema:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (validCount{{= $level }} < 2) {
  {{?}}

  {{
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '.oneOf[' + $i + ']';
  }}

  var valid = ({{= it.validate($it) }})(data, dataPath);
  if (valid) validCount{{= $level }}++;
{{~}}

{{= $closingBraces }}

if (validCount{{= $level }} == 1) validate.errors.length = errs{{= $level }};
else validate.errors.push({
  keyword: 'oneOf',
  dataPath: dataPath,
  message: 'should match exactly one schema in oneOf'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.oneOf'}}, data: data{{?}}
});

var valid = validCount{{= $level }} == 1;
