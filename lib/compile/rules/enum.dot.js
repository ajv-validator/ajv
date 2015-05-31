{{ var $itemsHash = it.toHash(it.schema.enum, it.stableStringify); }}

var req_itemsHash = {{= JSON.stringify($itemsHash) }};
var valid = req_itemsHash[stableStringify(data)] || false;

if (!valid) validate.errors.push({
  keyword: 'enum',
  dataPath: dataPath,
  message: 'should be equal to one of values'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.enum' }}, data: data{{?}}
});
