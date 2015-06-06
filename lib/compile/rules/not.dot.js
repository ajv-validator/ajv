{{# def.definitions }}
{{# def.setup:'not' }}
{{# def.setupNextLevel }}

{{
  $it.schema = $schema;
  $it.schemaPath = $schemaPath;
}}

var {{=$errs}} = validate.errors.length;

{{= it.validate($it) }}

var {{=$valid}} = valid{{=$it.level}};
{{=$valid}} = !{{=$valid}};

if ({{=$valid}}) validate.errors.length = {{=$errs}};
else {{# def.error:'not' }}
