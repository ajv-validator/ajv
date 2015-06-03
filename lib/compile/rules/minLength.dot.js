{{# def.definitions }}
{{# def.setup:'minLength' }}

var valid = data{{=$dataLvl}}.length >= {{=$schema}};

{{# def.checkError:'minLength' }}
