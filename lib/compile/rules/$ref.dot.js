{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' || $schema == '#/' }}
  var errors{{=$lvl}} = validate.errors;
  if (!validate({{=$data}}, (dataPath || '') + {{= it.errorPath }}))
    validate.errors = errors{{=$lvl}}.concat(validate.errors);
  {{? $breakOnError }} else { {{?}}
{{??}}
  {{ $id = it.resolveRef(it.baseId, $schema); }}
  {{? $id === undefined }}
    {{# def.error:'$ref' }}
    {{? $breakOnError }} if (false) { {{?}}
  {{??}}
    if (!refVal[{{=$id}}]({{=$data}}, (dataPath || '') + {{= it.errorPath }}))
      validate.errors = validate.errors.concat(refVal[{{=$id}}].errors);
    {{? $breakOnError }} else { {{?}}
  {{?}}
{{?}}
