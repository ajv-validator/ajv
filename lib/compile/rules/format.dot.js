{{# def.definitions }}

{{? it.opts.format !== false }}
  {{# def.setup:'format' }}
  {{ var $mode = it.opts.format == 'full' ? 'full' : 'fast'; }}

  var format{{=$lvl}} = formats.{{= $mode }}['{{=$schema}}'];
  var {{=$valid}} = typeof format{{=$lvl}} == 'function'
                        ? format{{=$lvl}}({{=$data}})
                        : !format{{=$lvl}} || format{{=$lvl}}.test({{=$data}});

  {{# def.checkError:'format' }}
{{??}}
  var {{=$valid}} = true;
{{?}}
