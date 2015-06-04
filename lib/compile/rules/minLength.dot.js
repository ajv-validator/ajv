{{# def.definitions }}
{{# def.setup:'minLength' }}

var valid{{=$lvl}} = data{{=$dataLvl}}.length >= {{=$schema}};

{{# def.checkErrorLvl:'minLength' }}
