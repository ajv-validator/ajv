function (data, dataType, dataPath) {
  'use strict';

  {{? it.schema && it.opts.uniqueItems !== false }}
    if (data.length <= 1) return { valid: true, errors: [] };
    var itemsHash = {}, errors = [];

    for (var i = 0; i < data.length; i++) {
      var itemStr = stableStringify(data[i]);
      var isDuplicate = itemsHash[itemStr];
      if (isDuplicate) {
        var error = {
          keyword: 'uniqueItems',
          schema: {{= it.schema }},
          dataPath: dataPath,
          message: 'item #' + i + 'is duplicate'
          {{? it.opts.verbose }}, data: data{{?}}
        };

        {{? it.opts.allErrors }}
          errors.push(error);
        {{??}}
          return { valid: false, errors: [error] };
        {{?}}
      } else {
        itemsHash[itemStr] = true;
      }
    }

    {{? it.opts.allErrors }}
      return { valid: !errors.length, errors: errors };
    {{??}}
      return { valid: true, errors: [] };
    {{?}}
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
