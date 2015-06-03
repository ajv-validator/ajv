{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

var errs{{=$lvl}} = validate.errors.length;
var valid = false;

{{~ $schema:$sch:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (!valid) {
  {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  valid = valid || ({{= it.validate($it) }})(data{{=$dataLvl}}, dataPath{{=$dataLvl}});
{{~}}

{{= $closingBraces }}

if (valid) validate.errors.length = errs{{=$lvl}};
