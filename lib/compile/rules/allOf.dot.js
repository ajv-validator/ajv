{{# def.definitions }}
{{# def.setup:'allOf' }}
{{# def.setupNextLevel }}

var valid{{=$lvl}} = true;

{{~ $schema:$sch:$i }}
  {{? $i}} {{# def.ifValid }} {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{ $it.inline = true; }}
  {{= it.validate($it) }}

  valid{{=$lvl}} = valid{{=$lvl}} && valid{{=$it.level}};
{{~}}

{{= $closingBraces }}
