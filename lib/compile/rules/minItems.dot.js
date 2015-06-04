{{# def.definitions }}
{{# def.setup:'minItems' }}

var valid{{=$lvl}} = data{{=$dataLvl}}.length >= {{=$schema}};

{{# def.checkError:'minItems' }}
