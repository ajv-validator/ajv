{{# def.definitions }}
{{# def.setup:'enum' }}

{{
  var $itemsHash = it.toHash($schema, it.stableStringify);
}}

var itemsHash{{=$lvl}} = {{= JSON.stringify($itemsHash) }};
var valid{{=$lvl}} = itemsHash{{=$lvl}}[stableStringify(data{{=$dataLvl}})] || false;

{{# def.checkError:'enum' }}
