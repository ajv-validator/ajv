{{# def.definitions }}
{{# def.setup:'minItems' }}

var valid = data{{=$dataLvl}}.length >= {{=$schema}};

{{# def.checkError:'minItems' }}
