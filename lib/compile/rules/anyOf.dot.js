{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

var errs{{=$lvl}} = validate.errors.length;
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

  {{ $it.inline = true; }}
  {{= it.validate($it) }}

  {{=$valid}} = {{=$valid}} || valid{{=$it.level}};
{{~}}

{{= $closingBraces }}

if ({{=$valid}}) validate.errors.length = errs{{=$lvl}};
