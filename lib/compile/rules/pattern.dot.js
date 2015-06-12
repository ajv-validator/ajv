{{# def.definitions }}
{{# def.setup:'pattern' }}

{{ new RegExp($schema); /* test if regexp is valid to fail at compile time rather than in eval */}}
if (! /{{= it.util.escapeRegExp($schema) }}/.test({{=$data}}) )
  {{# def.error:'pattern' }}
{{? $breakOnError }} else { {{?}}
