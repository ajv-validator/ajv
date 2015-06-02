var valid = true;

{{ var $lvl = it.level; }}

{{? it.schema.uniqueItems && it.opts.uniqueItems !== false }}
  if (data.length > 1) {
    var i{{=$lvl}} = data.length, j{{=$lvl}};
    outer:
    for (;i{{=$lvl}}--;) {
      for (j{{=$lvl}} = i{{=$lvl}}; j{{=$lvl}}--;) {
        if (equal(data[i{{=$lvl}}], data[j{{=$lvl}}])) {
          valid = false;
          break outer;
        }
      }
    }

    if (!valid) {
      validate.errors.push({
        keyword: 'uniqueItems',
        dataPath: dataPath,
        message: 'items ## ' + i{{=$lvl}} + ' and ' + j{{=$lvl}} + ' are duplicate'
        {{? it.opts.verbose }}, schema: {{= it.schema.uniqueItems }}, data: data{{?}}
      });
    }
  }
{{?}}
