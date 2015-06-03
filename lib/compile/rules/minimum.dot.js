{{# def.definitions }}
{{# def.setup:'minimum' }}

{{
  var $exclusive = it.schema.exclusiveMinimum === true
    , $op = $exclusive ? '>' : '>=';
}}

var valid = data{{=$dataLvl}} {{=$op}} {{=$schema}};

{{# def.checkError:'minimum' }}
