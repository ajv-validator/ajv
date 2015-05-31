{{ var $enum_itemsHash = it.toHash(it.schema.enum, it.stableStringify); }}

var itemsHash = {{= JSON.stringify($enum_itemsHash) }};
var valid = itemsHash[stableStringify(data)] || false;

if (!valid) validate.errors.push({
  keyword: 'enum',
  dataPath: dataPath,
  message: 'should be equal to one of values'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.enum' }}, data: data{{?}}
});
