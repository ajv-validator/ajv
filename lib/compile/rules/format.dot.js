{{# def.definitions }}
{{# def.setup:'format' }}

{{ var $format = it.formats[$schema]; }}

{{## def.format: formats{{= it.util.getProperty($schema) }} #}}

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
