{{# def.definitions }}
{{# def.setup:'pattern' }}

{{ new RegExp($schema); /* test if regexp is valid to fail at compile time rather than in eval */}}
var valid = /{{=$schema}}/.test(data);

{{# def.checkError:'pattern' }}
