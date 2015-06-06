{{# def.definitions }}
{{# def.setup:'uniqueItems' }}

var {{=$valid}} = true;

{{? $schema && it.opts.uniqueItems !== false }}
  if ({{=$data}}.length > 1) {
    var i = {{=$data}}.length, j;
    outer:
    for (;i--;) {
      for (j = i; j--;) {
        if (equal({{=$data}}[i], {{=$data}}[j])) {
          {{=$valid}} = false;
          break outer;
        }
      }
    }

    {{# def.checkError:'uniqueItems' }}
  }
{{?}}
