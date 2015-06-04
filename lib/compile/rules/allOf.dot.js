{{# def.definitions }}
{{# def.setup:'allOf' }}
{{# def.setupNextLevel }}

var {{=$valid}} = true;

{{~ $schema:$sch:$i }}
  {{? $i}} {{# def.ifValid }} {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  {{ $it.inline = true; }}
  {{= it.validate($it) }}

  {{=$valid}} = {{=$valid}} && valid{{=$it.level}};
{{~}}

{{= $closingBraces }}
