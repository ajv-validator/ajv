{{# def.definitions }}

{{? it.opts.format !== false }}
  {{# def.setup:'format' }}

  var format{{=$lvl}} = formats['{{=$schema}}'];
  var {{=$valid}} = typeof format{{=$lvl}} == 'function'
                        ? format{{=$lvl}}({{=$data}})
                        : !format{{=$lvl}} || format{{=$lvl}}.test({{=$data}});

  {{# def.checkError:'format' }}
{{??}}
  var {{=$valid}} = true;
{{?}}
