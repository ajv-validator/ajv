{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' || $schema == '#/' }}
  var errors{{=$lvl}} = validate.errors;
  if (!validate({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
    if (errors{{=$lvl}} !== null) {
      validate.errors = errors{{=$lvl}}.concat(validate.errors);
    }
    errors = validate.errors.length;
  } {{? $breakOnError }} else { {{?}}
{{??}}
  {{ $id = it.resolveRef(it.baseId, $schema); }}
  {{? $id === undefined }}
    {{# def.error:'$ref' }}
    {{? $breakOnError }} if (false) { {{?}}
  {{??}}
    if (!refVal[{{=$id}}]({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
      if (validate.errors === null) validate.errors = refVal[{{=$id}}].errors;
      else validate.errors.push.apply(validate.errors, refVal[{{=$id}}].errors);
      errors = validate.errors.length;
    } {{? $breakOnError }} else { {{?}}
  {{?}}
{{?}}
