{{? it.opts.allErrors }} var errs = validate.errors.length; {{?}}

var valid = true;

{{? it.schema.uniqueItems && it.opts.uniqueItems !== false }}
  if (data.length > 1) {
    var unique_itemsHash = {};

    for (var i = 0; i < data.length; i++) {
      var itemStr = stableStringify(data[i]);
      var valid = valid && !unique_itemsHash[itemStr];
      if (valid)
        unique_itemsHash[itemStr] = true;
      else {
        validate.errors.push({
          keyword: 'uniqueItems',
          dataPath: dataPath,
          message: 'item #' + i + 'is duplicate'
          {{? it.opts.verbose }}, schema: {{= it.schema.uniqueItems }}, data: data{{?}}
        });

        {{? !it.opts.allErrors }} break; {{?}}
      }
    }
  }
{{?}}
