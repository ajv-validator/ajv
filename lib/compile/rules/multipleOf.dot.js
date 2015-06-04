{{# def.definitions }}
{{# def.setup:'multipleOf' }}

var division{{=$lvl}} = {{=$data}} / {{=$schema}};
var {{=$valid}} = division{{=$lvl}} === parseInt(division{{=$lvl}});

{{# def.checkError:'multipleOf' }}
