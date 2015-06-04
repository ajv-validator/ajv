{{# def.definitions }}
{{# def.setup:'not' }}
{{# def.setupNextLevel }}

{{
  $it.schema = $schema;
  $it.schemaPath = $schemaPath;
  $it.inline = true;
}}

var errs{{=$lvl}} = validate.errors.length;

{{= it.validate($it) }}

var {{=$valid}} = valid{{=$it.level}};
{{=$valid}} = !{{=$valid}};

if ({{=$valid}}) validate.errors.length = errs{{=$lvl}};
else {{# def.error:'not' }}
