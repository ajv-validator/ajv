{{# def.definitions }}
{{# def.setup:'oneOf' }}
{{# def.setupNextLevel }}


var {{=$errs}} = errors;
var prevValid{{=$lvl}} = false;
var {{=$valid}} = false;

{{~ $schema:$sch:$i }}
  {{? {{# def.nonEmptySchema:$sch }} }}
    {{
      $it.schema = $sch;
      $it.schemaPath = $schemaPath + '[' + $i + ']';
    }}

    {{= it.validate($it) }}
  {{??}}
    var valid{{=$it.level}} = true;
  {{?}}

  {{? $i }}
    if (valid{{=$it.level}} && prevValid{{=$lvl}})
      {{=$valid}} = false;
    else {
    {{ $closingBraces += '}'; }}
  {{?}}

    if (valid{{=$it.level}}) {{=$valid}} = prevValid{{=$lvl}} = true;
{{~}}

{{= $closingBraces }}

if (!{{=$valid}}) {
  {{# def.error:'oneOf' }}
} else {
  errors = {{=$errs}};
  if (validate.errors !== null) {
    if ({{=$errs}}) validate.errors.length = {{=$errs}};
    else validate.errors = null;
  }

{{? it.opts.allErrors }} } {{?}}
