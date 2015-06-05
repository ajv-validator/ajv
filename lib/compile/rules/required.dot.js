{{# def.definitions }}
{{# def.setup:'required' }}

{{? $schema.length <= 100 }}
  {{=$valid}} = {{~ $schema:$property:$i }}
                     {{? $i}} && {{?}}
                     {{=$data}}['{{= it.escapeQuotes($property) }}'] !== undefined
                   {{~}};
{{??}}
  var schema{{=$lvl}} = validate.schema{{=$schemaPath}};

  for (var i{{=$lvl}} = 0; i{{=$lvl}} < schema{{=$lvl}}.length; i{{=$lvl}}++) {
    {{=$valid}} = data[schema{{=$lvl}}[i{{=$lvl}}]] !== undefined;
    if (!{{=$valid}}) break;
  }
{{?}}

{{# def.checkError:'required' }}
