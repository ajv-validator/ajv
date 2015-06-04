{{# def.definitions }}
{{# def.setup:'pattern' }}

{{ new RegExp($schema); /* test if regexp is valid to fail at compile time rather than in eval */}}
var valid{{=$lvl}} = /{{=$schema}}/.test(data{{=$dataLvl}});

{{# def.checkErrorLvl:'pattern' }}
