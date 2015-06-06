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

  {{= it.validate($it) }}

  {{=$valid}} = {{=$valid}} && valid{{=$it.level}};
{{~}}

{{= $closingBraces }}
