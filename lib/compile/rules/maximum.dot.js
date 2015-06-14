{{# def.definitions }}
{{# def.setup:'maximum' }}

{{ 
  var $exclusive = it.schema.exclusiveMaximum === true
    , $op = $exclusive ? '<' : '<=';
}}

if (! ({{=$data}} {{=$op}} {{=$schema}}) ) {
  {{# def.error:'maximum' }}
} {{? $breakOnError }} else { {{?}}
