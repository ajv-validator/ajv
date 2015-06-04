{{# def.definitions }}
{{# def.setup:'minimum' }}

{{
  var $exclusive = it.schema.exclusiveMinimum === true
    , $op = $exclusive ? '>' : '>=';
}}

var valid{{=$lvl}} = data{{=$dataLvl}} {{=$op}} {{=$schema}};

{{# def.checkErrorLvl:'minimum' }}
