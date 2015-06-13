{{# def.definitions }}
{{# def.setup:'format' }}

{{ 
  var $mode = it.opts.format == 'full' ? 'full' : 'fast'
    , $format = it.formats[$mode][$schema];
}}

{{## def.format: formats.{{= $mode }}['{{=$schema}}'] #}}

{{## def.checkFormat:
  {{? typeof $format == 'function' }}
    {{# def.format }}({{=$data}})
  {{??}}
    {{# def.format }}.test({{=$data}})
  {{?}}
#}}

{{? it.opts.format !== false && $format }}
  if (! {{# def.checkFormat }}) {
    {{# def.error:'format' }}
  } {{? $breakOnError }} else { {{?}}
{{??}}
  {{? $breakOnError }} if (true) { {{?}}
{{?}}
