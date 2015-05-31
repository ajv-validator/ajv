var anyOf_errs = validate.errors.length;

var valid = false;
{{ var $closingBraces = ''; }}
{{~ it.schema.anyOf:$schema:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (!valid) {
  {{?}}

  {{ 
    var $it = it.copy(it);
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '.anyOf[' + $i + ']';
  }}

  valid = valid || ({{= it.validate($it) }})(data, dataPath);

{{~}}

{{= $closingBraces }}

if (valid) validate.errors.length = anyOf_errs;
