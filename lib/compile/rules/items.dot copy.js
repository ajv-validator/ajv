{{## def.validateItems:startFrom:
  for (var i = {{= startFrom }}; i < data.length; i++) {
    var _data = data[i]
      , _dataPath = dataPath + '[' + i + ']';

    {{? $breakOnError }} valid = {{?}}
      validateItems(_data, _dataPath);

    {{? $breakOnError }} if (!valid) break; {{?}}
  }
#}}


{{
  var $it = it.copy(it)
    , $breakOnError = !it.opts.allErrors
    , $closingBraces = ''
    , $itemsSchema = it.schema.items;
}}

var items_errs = validate.errors.length;
var valid;

{{? Array.isArray($itemsSchema) }}
  {{ var $additionalItems = it.schema.additionalItems; }}
  {{? $additionalItems === false }}
    valid = data.length <= {{= $itemsSchema.length }};
    if (!valid) {
      validate.errors.push({
        keyword: 'additionalItems',
        dataPath: dataPath,
        message: 'should NOT have more than {{= $itemsSchema.length }} items'
        {{? it.opts.verbose }}, schema: false, data: data{{?}}
      }); 
    }
    {{? $breakOnError }}
      {{ $closingBraces += '}'; }}
      else {
    {{?}}
  {{?}}

  {{~ $itemsSchema:$schema:$index }}
    {{? Object.keys($schema).length }}
      {{? $breakOnError }} valid = true; {{?}}
      if ({{= $index }} < data.length) {
        {{
          $it.schema = $schema;
          $it.schemaPath = it.schemaPath + '.items[' + $index + ']';
        }}

        var _data = data[{{= $index }}]
          , _dataPath = dataPath + '[{{= $index }}]';

        {{? $breakOnError }} valid = {{?}}
          ({{= it.validate($it) }})(_data, _dataPath);
      }

      {{? $breakOnError }}
        {{ $closingBraces += '}'; }}
        if (valid) {
      {{?}}
    {{?}}
  {{~}}

  {{? typeof $additionalItems == 'object' && Object.keys($additionalItems).length }}
    {{
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
    }}

    valid = true;

    if (data.length > {{= $itemsSchema.length }}) {
      var validateItems = ({{= it.validate($it) }});
      {{# def.validateItems: $itemsSchema.length }}
    }

    {{? $breakOnError }}
      {{ $closingBraces += '}'; }}
      if (valid) {
    {{?}}
  {{?}}

{{?? Object.keys($itemsSchema).length }}
  var validateItems = ({{= it.validate(it) }});
  {{# def.validateItems: 0 }}
{{?}}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

valid = items_errs == validate.errors.length;
