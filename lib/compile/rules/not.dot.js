{{# def.definitions }}
{{# def.setup:'not' }}
{{# def.setupNextLevel }}

{{? {{# def.nonEmptySchema:$schema }} }}
  {{
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
  }}

  var {{=$errs}} = validate.errors.length;

  {{= it.validate($it) }}

  if (valid{{=$it.level}})
    {{# def.error:'not' }}
  else {
    validate.errors.length = {{=$errs}};

  {{? it.opts.allErrors }} } {{?}}
{{??}}
  {{# def.error:'not' }}
  {{? $breakOnError}}
    if (false) {
  {{?}}
{{?}}