{{# def.definitions }}
{{# def.setup:'$ref' }}

{{? $schema == '#' }}
  var {{=$valid}} = validate({{=$data}}, (dataPath || '') + {{= it.errorPath }});
{{??}}
  {{ $refId = it.resolveRef($schema); }}
  {{? $refId === undefined }}
    {{# def.error:'$ref' }}
    var {{=$valid}} = false;
  {{??}}
    var {{=$valid}} = refs[{{=$refId}}]({{=$data}}, (dataPath || '') + {{= it.errorPath }});
    if (!{{=$valid}}) validate.errors.push.apply(validate.errors, refs[{{=$refId}}].errors);
  {{?}}
{{?}}
