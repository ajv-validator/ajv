var foundValid = false
  , oneOf_errs = validate.errors.length;

var validCount = 0;
{{ var $closingBraces = ''; }}
{{ var $it = it.copy(it); }}

{{~ it.schema.oneOf:$schema:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (validCount < 2) {
  {{?}}

  {{
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '.oneOf[' + $i + ']';
  }}

  var valid = ({{= it.validate($it) }})(data, dataPath);
  if (valid) validCount++;
{{~}}

{{= $closingBraces }}

if (validCount == 1) validate.errors.length = oneOf_errs;
else validate.errors.push({
  keyword: 'oneOf',
  dataPath: dataPath,
  message: 'should match exactly one schema in oneOf'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.oneOf'}}, data: data{{?}}
});

var valid = validCount == 1;
