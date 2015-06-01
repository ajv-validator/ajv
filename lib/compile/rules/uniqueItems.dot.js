{{## def.checkUnique:
  if (unique_itemsHash[item]) {
    valid = false;
    break outer;
  }
  unique_itemsHash[item] = true;
#}}

var valid = true;

{{? it.schema.uniqueItems && it.opts.uniqueItems !== false }}
  if (data.length > 1) {
    var unique_itemsHash = {};

    outer:
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      switch (typeof item) {
        case 'object':
          if (item === null) {
            {{# def.checkUnique }}
          } else {
            for (var j = i+1; j < data.length; j++) {
              if (equal(item, data[j])) {
                valid = false;
                break outer;
              }
            }
          }
          break;
        case 'string':
          item = '"' + item;
          /* fall through */
        default:
          {{# def.checkUnique }}
      }
    }

    if (!valid) {
      validate.errors.push({
        keyword: 'uniqueItems',
        dataPath: dataPath,
        message: 'item #' + i + 'is duplicate'
        {{? it.opts.verbose }}, schema: {{= it.schema.uniqueItems }}, data: data{{?}}
      });
    }
  }
{{?}}
