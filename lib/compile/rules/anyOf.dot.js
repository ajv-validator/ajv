{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

{{
  var $noEmptySchema = $schema.every(function($sch) {
    return {{# def.nonEmptySchema:$sch }};
  });
}}
{{? $noEmptySchema }}
  var {{=$errs}} = errors;
  var {{=$valid}} = false;

  {{~ $schema:$sch:$i }}
    {{
      $it.schema = $sch;
      $it.schemaPath = $schemaPath + '[' + $i + ']';
    }}

    {{= it.validate($it) }}

    {{=$valid}} = {{=$valid}} || valid{{=$it.level}};

    if (!{{=$valid}}) {
    {{ $closingBraces += '}'; }}
  {{~}}

  {{= $closingBraces }}

  if ({{=$valid}}) {
    errors = {{=$errs}};
    if (validate.errors !== null) {
      if ({{=$errs}}) validate.errors.length = {{=$errs}};
      else validate.errors = null;
    }
  {{? it.opts.allErrors }} } {{?}}

  {{# def.cleanUp }}
{{??}}
  {{? $breakOnError }}
    if (true) {
  {{?}}
{{?}}
