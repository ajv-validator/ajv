var valid = true;

{{? it.schema.uniqueItems && it.opts.uniqueItems !== false }}
  if (data.length > 1) {
    var i = data.length, j;
    outer:
    for (;i--;) {
      for (j = i; j--;) {
        if (equal(data[i], data[j])) {
          valid = false;
          break outer;
        }
      }
    }

    if (!valid) {
      validate.errors.push({
        keyword: 'uniqueItems',
        dataPath: dataPath,
        message: 'items ## ' + i + ' and ' + j + ' are duplicate'
        {{? it.opts.verbose }}, schema: {{= it.schema.uniqueItems }}, data: data{{?}}
      });
    }
  }
{{?}}
