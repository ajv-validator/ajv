{{# def.definitions }}
{{# def.setup:'allOf' }}
{{# def.setupNextLevel }}

var valid = true;

{{~ $schema:$sch:$i }}
  {{? $i}} {{# def.ifValid }} {{?}}

  {{ 
    $it.schema = $sch;
    $it.schemaPath = $schemaPath + '[' + $i + ']';
  }}

  valid = valid && ({{= it.validate($it) }})(data{{=$dataLvl}}, dataPath{{=$dataLvl}});
{{~}}

{{= $closingBraces }}
