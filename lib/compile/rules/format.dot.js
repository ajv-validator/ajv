{{# def.definitions }}

{{? it.opts.format !== false }}
  {{# def.setup:'format' }}

  var format{{=$lvl}} = formats['{{=$schema}}'];
  var valid = typeof format{{=$lvl}} == 'function'
                ? format{{=$lvl}}(data{{=$dataLvl}})
                : !format{{=$lvl}} || format{{=$lvl}}.test(data{{=$dataLvl}});

  {{# def.checkError:'format' }}
{{??}}
  var valid = true;
{{?}}
