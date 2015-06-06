{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

var {{=$errs}} = validate.errors.length;
var {{=$valid}} = false;

{{~ $schema:$sch:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (!{{=$valid}}) {
  {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{= it.validate($it) }}

  {{=$valid}} = {{=$valid}} || valid{{=$it.level}};
{{~}}

{{= $closingBraces }}

if ({{=$valid}}) validate.errors.length = {{=$errs}};
