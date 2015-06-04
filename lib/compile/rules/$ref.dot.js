{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? it.resolveRef($schema) }}
  var result{{=$lvl}} = validateRef('{{=$schema}}', data{{=$dataLvl}}, dataPath{{=$dataLvl}});
  var valid{{=$lvl}} = result{{=$lvl}}.valid;
  if (!valid{{=$lvl}}) validate.errors.push.apply(validate.errors, result{{=$lvl}}.errors);
{{??}}
  {{# def.error:'$ref' }}
  var valid{{=$lvl}} = false;
{{?}}
