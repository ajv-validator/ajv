{{ var $itemsHash = it.toHash(it.schema.enum, it.stableStringify); }}

var itemsHash{{= it.level }} = {{= JSON.stringify($itemsHash) }};
var valid = itemsHash{{= it.level }}[stableStringify(data)] || false;

if (!valid) validate.errors.push({
  keyword: 'enum',
  dataPath: dataPath,
  message: 'should be equal to one of values'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.enum' }}, data: data{{?}}
});
