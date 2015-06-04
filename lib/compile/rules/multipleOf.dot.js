{{# def.definitions }}
{{# def.setup:'multipleOf' }}

var division{{=$lvl}} = data{{=$dataLvl}} / {{=$schema}};
var valid{{=$lvl}} = division{{=$lvl}} === parseInt(division{{=$lvl}});

{{# def.checkErrorLvl:'multipleOf' }}
