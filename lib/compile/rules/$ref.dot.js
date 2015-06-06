{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' || $schema == '#/' }}
  var {{=$valid}} = validate({{=$data}}, (dataPath || '') + {{= it.errorPath }});
{{??}}
  {{ $id = it.resolveRef($schema); }}
  {{? $id === undefined }}
    {{# def.error:'$ref' }}
    var {{=$valid}} = false;
  {{??}}
    var {{=$valid}} = refVal[{{=$id}}]({{=$data}}, (dataPath || '') + {{= it.errorPath }});
    if (!{{=$valid}}) validate.errors.push.apply(validate.errors, refVal[{{=$id}}].errors);
  {{?}}
{{?}}
