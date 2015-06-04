{{# def.definitions }}
{{# def.setup:'uniqueItems' }}

var {{=$valid}} = true;

{{? $schema && it.opts.uniqueItems !== false }}
  if ({{=$data}}.length > 1) {
    var i{{=$lvl}} = {{=$data}}.length, j{{=$lvl}};
    outer:
    for (;i{{=$lvl}}--;) {
      for (j{{=$lvl}} = i{{=$lvl}}; j{{=$lvl}}--;) {
        if (equal({{=$data}}[i{{=$lvl}}], {{=$data}}[j{{=$lvl}}])) {
          {{=$valid}} = false;
          break outer;
        }
      }
    }

    {{# def.checkError:'uniqueItems' }}
  }
{{?}}
