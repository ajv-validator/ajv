{{# def.definitions }}
{{# def.setup:'type' }}

{{ var $isArray = Array.isArray($schema); }}

{{? $isArray }}
  var {{=$valid}} = {{= it.checkDataTypes($schema, $dataLvl) }};
{{??}}
  var {{=$valid}} = {{= it.checkDataType($schema, $dataLvl) }};
{{?}}

{{# def.checkError:'type' }}
