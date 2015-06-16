{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' || $schema == '#/' }}
  {{? it.isRoot }}
    {{? $breakOnError && it.wasTop }}
      if (!validate({{=$data}}, (dataPath || '') + {{= it.errorPath }}))
        return false;
      else {
    {{??}}
      var errors{{=$lvl}} = validate.errors;
      if (!validate({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
        if (errors{{=$lvl}} !== null) {
          validate.errors = errors{{=$lvl}}.concat(validate.errors);
        }
        errors = validate.errors.length;
      } {{? $breakOnError }} else { {{?}}
    {{?}}
  {{??}}
    {{ var $v = 'v' + $lvl; }}
    var {{=$v}} = root.refVal[0];
    if (!{{=$v}}({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
      if (validate.errors === null) validate.errors = {{=$v}}.errors;
      else validate.errors = validate.errors.concat({{=$v}}.errors);
      errors = validate.errors.length;
    } {{? $breakOnError }} else { {{?}}
  {{?}}
{{??}}
  {{ var $refVal = it.resolveRef(it.baseId, $schema, it.rootId); }}
  {{? $refVal === undefined }}
    {{# def.error:'$ref' }}
    {{? $breakOnError }} if (false) { {{?}}
  {{??}}
    {{ var $v = 'v' + $lvl; }}
    var {{=$v}} = {{=$refVal}};
    if (!{{=$v}}({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
      if (validate.errors === null) validate.errors = {{=$v}}.errors;
      else validate.errors = validate.errors.concat({{=$v}}.errors);
      errors = validate.errors.length;
    } {{? $breakOnError }} else { {{?}}
  {{?}}
{{?}}
