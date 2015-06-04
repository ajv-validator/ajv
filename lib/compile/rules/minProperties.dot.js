{{# def.definitions }}
{{# def.setup:'minProperties' }}

var valid{{=$lvl}} = Object.keys(data{{=$dataLvl}}).length >= {{=$schema}};

{{# def.checkErrorLvl:'minProperties' }}