{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

var errs{{=$lvl}} = validate.errors.length;
var valid{{=$lvl}} = false;

{{~ $schema:$sch:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (!valid{{=$lvl}}) {
  {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{ $it.inline = true; }}
  {{= it.validate($it) }}

  valid{{=$lvl}} = valid{{=$lvl}} || valid{{=$it.level}};
{{~}}

{{= $closingBraces }}

if (valid{{=$lvl}}) validate.errors.length = errs{{=$lvl}};

valid = valid{{=$lvl}};