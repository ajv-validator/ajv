{{# def.definitions }}
{{# def.setup:'minItems' }}

var {{=$valid}} = {{=$data}}.length >= {{=$schema}};

{{# def.checkError:'minItems' }}
