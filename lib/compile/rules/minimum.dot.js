{{# def.definitions }}
{{# def.setup:'minimum' }}

{{
  var $exclusive = it.schema.exclusiveMinimum === true
    , $op = $exclusive ? '>' : '>=';
}}

if (!( {{=$data}} {{=$op}} {{=$schema}} )) {
  {{# def.error:'minimum' }}
} {{? $breakOnError }} else { {{?}}
