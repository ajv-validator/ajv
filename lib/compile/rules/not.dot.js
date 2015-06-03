{{# def.definitions }}
{{# def.setup:'not' }}
{{# def.setupNextLevel }}

{{
  $it.schema = $schema;
  $it.schemaPath = $schemaPath;
}}

var errs{{=$lvl}} = validate.errors.length;

var valid = ({{= it.validate($it) }})(data{{=$dataLvl}}, dataPath{{=$dataLvl}});
valid = !valid;

if (valid) validate.errors.length = errs{{=$lvl}};
else {{# def.error:'not' }}
