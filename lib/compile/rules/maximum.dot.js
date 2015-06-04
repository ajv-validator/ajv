{{# def.definitions }}
{{# def.setup:'maximum' }}

{{ 
  var $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

var valid{{=$lvl}} = data{{=$dataLvl}} {{=$op}} {{=$schema}};

{{# def.checkError:'maximum' }}

