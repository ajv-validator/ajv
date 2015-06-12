{{# def.definitions }}
{{# def.setup:'oneOf' }}
{{# def.setupNextLevel }}


var {{=$errs}} = validate.errors.length;
var prevValid{{=$lvl}} = false;
var {{=$valid}} = false;

{{~ $schema:$sch:$i }}

  {{
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{= it.validate($it) }}

  {{? $i }}
    if (valid{{=$it.level}} && prevValid{{=$lvl}})
      {{=$valid}} = false;
    else {
    {{ $closingBraces += '}'; }}
  {{?}}

    if (valid{{=$it.level}}) {{=$valid}} = prevValid{{=$lvl}} = true;
{{~}}

{{= $closingBraces }}

if (!{{=$valid}})
  {{# def.error:'oneOf' }}
else {
  validate.errors.length = {{=$errs}};

{{? it.opts.allErrors }} } {{?}}
