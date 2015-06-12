{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' || $schema == '#/' }}
  {{? $breakOnError }} if ( {{?}}
    validate({{=$data}}, (dataPath || '') + {{= it.errorPath }})
  {{? $breakOnError }} ) { {{??}};{{?}}
{{??}}
  {{ $id = it.resolveRef(it.baseId, $schema); }}
  {{? $id === undefined }}
    {{# def.error:'$ref' }}
    {{? $breakOnError }} if (false) { {{?}}
  {{??}}
    if (!refVal[{{=$id}}]({{=$data}}, (dataPath || '') + {{= it.errorPath }})) {
      validate.errors.push.apply(validate.errors, refVal[{{=$id}}].errors);
    }
    {{? $breakOnError }} else { {{?}}
  {{?}}
{{?}}
