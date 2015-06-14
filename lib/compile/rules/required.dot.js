{{# def.definitions }}
{{# def.setup:'required' }}

{{## def.checkRequired:
  {{~ $schema:$property:$i }}
    {{? $i}} || {{?}}
    {{=$data}}{{= it.util.getProperty($property) }} === undefined
  {{~}}
#}}

{{? $schema.length <= 100 }}
  if ({{# def.checkRequired }}) {
    {{# def.error:'required' }}
  } {{? $breakOnError }} else { {{?}}
{{??}}
  var schema{{=$lvl}} = validate.schema{{=$schemaPath}};

  for (var i = 0; i < schema{{=$lvl}}.length; i++) {
    var {{=$valid}} = data[schema{{=$lvl}}[i]] !== undefined;
    if (!{{=$valid}}) break;
  }

  {{# def.checkError:'required' }}
  {{? $breakOnError }} else { {{?}}
{{?}}

