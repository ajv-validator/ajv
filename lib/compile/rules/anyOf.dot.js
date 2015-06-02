{{ 
  var $it = it.copy(it)
    , $closingBraces = ''
    , $level = it.level;
  $it.level++;
}}

var errs{{= $level}} = validate.errors.length;
var valid = false;

{{~ it.schema.anyOf:$schema:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (!valid) {
  {{?}}

  {{ 
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '.anyOf[' + $i + ']';
  }}

  valid = valid || ({{= it.validate($it) }})(data, dataPath);
{{~}}

{{= $closingBraces }}

if (valid) validate.errors.length = errs{{= $level}};
