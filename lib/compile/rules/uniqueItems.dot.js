function (data, dataType, dataPath) {
  'use strict';

  /* TODO change to inline ??? with break in the loop */

  var errs = validate.errors.length;

  {{? it.schema && it.opts.uniqueItems !== false }}
    if (data.length <= 1) return true;
    var itemsHash = {}, errors = [];

    for (var i = 0; i < data.length; i++) {
      var itemStr = stableStringify(data[i]);
      var isDuplicate = itemsHash[itemStr];
      if (isDuplicate) {
        validate.errors.push({
          keyword: 'uniqueItems',
          schema: {{= it.schema }},
          dataPath: dataPath,
          message: 'item #' + i + 'is duplicate'
          {{? it.opts.verbose }}, data: data{{?}}
        });

        {{? !it.opts.allErrors }} return false; {{?}}
      } else {
        itemsHash[itemStr] = true;
      }
    }

    return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
  {{??}}
    return true;
  {{?}}
}
