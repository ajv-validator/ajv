{{# def.definitions }}
{{# def.setup:'enum' }}

{{
  var $itemsHash = it.util.toHash($schema, it.util.stableStringify);
}}

var itemsHash{{=$lvl}} = {{= JSON.stringify($itemsHash) }};
var {{=$valid}} = itemsHash{{=$lvl}}[stableStringify({{=$data}})] || false;

{{# def.checkError:'enum' }}
