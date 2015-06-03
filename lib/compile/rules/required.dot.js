{{# def.definitions }}
{{# def.setup:'required' }}

{{? $schema.length <= 100 }}
  valid = {{~ $schema:$property:$i }}
            {{? $i}} && {{?}}
            data{{=$dataLvl}}.hasOwnProperty('{{= it.escapeQuotes($property) }}')
          {{~}};
{{??}}
  var schema{{=$lvl}} = validate.schema{{=$schemaPath}};

  for (var i{{=$lvl}} = 0; i{{=$lvl}} < schema{{=$lvl}}.length; i{{=$lvl}}++) {
    valid = data.hasOwnProperty(schema{{=$lvl}}[i{{=$lvl}}]);
    if (!valid) break;
  }
{{?}}

{{# def.checkError:'required' }}
