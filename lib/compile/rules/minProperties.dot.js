{{# def.definitions }}
{{# def.setup:'minProperties' }}

var {{=$valid}} = Object.keys({{=$data}}).length >= {{=$schema}};

{{# def.checkError:'minProperties' }}