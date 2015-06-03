{{# def.definitions }}
{{# def.setup:'oneOf' }}
{{# def.setupNextLevel }}


var errs{{=$lvl}} = validate.errors.length;
var validCount{{=$lvl}} = 0;

{{~ $schema:$sch:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (validCount{{=$lvl}} < 2) {
  {{?}}

  {{
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
    $it.inline = true;
  }}

  {{= it.validate($it) }}

  var valid{{=$lvl}} = valid{{=$it.level}};
  if (valid{{=$lvl}}) validCount{{=$lvl}}++;
{{~}}

{{= $closingBraces }}

var valid{{=$lvl}} = validCount{{=$lvl}} == 1;

if (valid{{=$lvl}}) validate.errors.length = errs{{=$lvl}};
else {{# def.error:'oneOf' }}

valid = valid{{=$lvl}};