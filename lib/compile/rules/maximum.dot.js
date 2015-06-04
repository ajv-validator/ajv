{{# def.definitions }}
{{# def.setup:'maximum' }}

{{ 
  var $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

var {{=$valid}} = {{=$data}} {{=$op}} {{=$schema}};

{{# def.checkError:'maximum' }}

