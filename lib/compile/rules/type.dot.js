{{# def.definitions }}
{{# def.setup:'type' }}

{{ var $isArray = Array.isArray($schema); }}

{{? $isArray }}
  var valid{{=$lvl}} = {{= it.checkDataTypes($schema, $dataLvl) }};
{{??}}
  var valid{{=$lvl}} = {{= it.checkDataType($schema, $dataLvl) }};
{{?}}

{{# def.checkErrorLvl:'type' }}
