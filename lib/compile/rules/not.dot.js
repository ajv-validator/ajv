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

var valid{{=$lvl}} = valid{{=$it.level}};
valid{{=$lvl}} = !valid{{=$lvl}};

if (valid{{=$lvl}}) validate.errors.length = errs{{=$lvl}};
else {{# def.error:'not' }}

valid = valid{{=$lvl}};