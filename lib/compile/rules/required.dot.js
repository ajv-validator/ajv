{{# def.definitions }}
{{# def.setup:'required' }}

{{? $schema.length <= 100 }}
  {{=$valid}} = {{~ $schema:$property:$i }}
                     {{? $i}} && {{?}}
                     {{=$data}}['{{= it.escapeQuotes($property) }}'] !== undefined
                   {{~}};
{{??}}
  var schema{{=$lvl}} = validate.schema{{=$schemaPath}};

  for (var i = 0; i < schema{{=$lvl}}.length; i++) {
    {{=$valid}} = data[schema{{=$lvl}}[i]] !== undefined;
    if (!{{=$valid}}) break;
  }
{{?}}

{{# def.checkError:'required' }}
