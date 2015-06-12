{{# def.definitions }}
{{# def.setup:'anyOf' }}
{{# def.setupNextLevel }}

{{
  var $noEmptySchema = $schema.every(function($sch) {
    return {{# def.nonEmptySchema:$sch }};
  });
}}
{{? $noEmptySchema }}
  var {{=$errs}} = validate.errors.length;
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
    validate.errors.length = {{=$errs}};
  {{? it.opts.allErrors }} } {{?}}

  {{# def.cleanUp }}
{{??}}
  {{? $breakOnError }}
    if (true) {
  {{?}}
{{?}}
