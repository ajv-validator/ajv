{{# def.definitions }}
{{# def.setup:'minProperties' }}

var valid = Object.keys(data{{=$dataLvl}}).length >= {{=$schema}};

{{# def.checkError:'minProperties' }}