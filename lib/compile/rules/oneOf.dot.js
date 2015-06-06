{{# def.definitions }}
{{# def.setup:'oneOf' }}
{{# def.setupNextLevel }}


var {{=$errs}} = validate.errors.length;
var validCount{{=$lvl}} = 0;

{{~ $schema:$sch:$i }}
  {{? $i }}
    {{ $closingBraces += '}'; }}
    if (validCount{{=$lvl}} < 2) {
  {{?}}

  {{
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{= it.validate($it) }}

  var {{=$valid}} = valid{{=$it.level}};
  if ({{=$valid}}) validCount{{=$lvl}}++;
{{~}}

{{= $closingBraces }}

var {{=$valid}} = validCount{{=$lvl}} == 1;

if ({{=$valid}}) validate.errors.length = {{=$errs}};
else {{# def.error:'oneOf' }}
