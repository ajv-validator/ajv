{{# def.definitions }}
{{# def.setup:'$ref' }}

{{## def.validateRef:_v:
  if (!{{# def._validateRef:_v }}) {
    if (validate.errors === null) validate.errors = {{=_v}}.errors;
    else validate.errors = validate.errors.concat({{=_v}}.errors);
    errors = validate.errors.length;
  } {{? $breakOnError }} else { {{?}}
#}}

{{## def._validateRef:_v: {{=_v}}({{=$data}}, (dataPath || '') + {{= it.errorPath }}) #}}

{{? $schema == '#' || $schema == '#/' }}
  {{? it.isRoot }}
    {{? $breakOnError && it.wasTop }}
      if (!{{# def._validateRef:'validate' }})
        return false;
      else {
    {{??}}
      var errors{{=$lvl}} = validate.errors;
      if (!{{# def._validateRef:'validate' }}) {
        if (errors{{=$lvl}} !== null)
          validate.errors = errors{{=$lvl}}.concat(validate.errors);
        errors = validate.errors.length;
      } {{? $breakOnError }} else { {{?}}
    {{?}}
  {{??}}
    {{ var $v = 'v' + $lvl; }}
    var {{=$v}} = root.refVal[0];
    {{# def.validateRef:$v }}
  {{?}}
{{??}}
  {{ var $refVal = it.resolveRef(it.baseId, $schema, it.rootId); }}
  {{? $refVal === undefined }}
    {{# def.error:'$ref' }}
    {{? $breakOnError }} if (false) { {{?}}
  {{??}}
    {{ var $v = 'v' + $lvl; }}
    var {{=$v}} = {{=$refVal}};
    {{# def.validateRef:$v }}
  {{?}}
{{?}}
