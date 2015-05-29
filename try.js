var out = 'function (data, dataType, dataPath) { \'use strict\'; var errors = []; ';
var $schemaDeps = {},
    $propertyDeps = {};
for ($property in it.schema) {
    var $schema = it.schema[$property];
    var $deps = Array.isArray($schema) ? $propertyDeps : $schemaDeps;
    $deps[$property] = $schema;
}
out += ' ';
for ($property in $propertyDeps) {
    out += ' if (data.hasOwnProperty(\'' + ($property) + '\')) { ';
    $deps = $propertyDeps[$property] out += ' var valid = ';
    var arr1 = $deps;
    if (arr1) {
        var $dep, $i = -1,
            l1 = arr1.length - 1;
        while ($i < l1) {
            $dep = arr1[$i += 1];
            if ($i) {
                out += ' || ';
            }
            out += 'data.hasOwnProperty(\'' + ($dep) + '\')';
        }
    }
    out += '; if (!valid) { var error = { keyword: \'dependencies\', schema: self.schema' + (it.schemaPath) + ', dataPath: dataPath, message: \'data\' + dataPath + \' is not valid, properties ' + ($deps.join(",")) + ' are required when property ' + ($property) + ' is present\' ';
    if (it.opts.verbose) {
        out += ', data: data';
    }
    out += ' } ';
    if (it.opts.allErrors) {
        out += ' errors.push(error); ';
    } else {
        out += ' return { valid: false, errors: [error] }; ';
    }
    out += ' } } ';
}
out += ' ';
for ($property in $schemaDeps) {
    out += ' if (data.hasOwnProperty(\'' + ($property) + '\')) { ';
    var $schema = $schemaDeps[$property];
    var $it = it.copy(it);
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '["' + it.escapeQuotes($property) + '"]';
    out += ' var result = (' + (it._validate($it)) + ')(data, dataType, dataPath); if (!result.valid) { ';
    if (it.opts.allErrors) {
        out += ' errors.push.apply(errors, result.errors); ';
    } else {
        out += ' return { valid: false, errors: result.errors }; ';
    }
    out += ' } } ';
}
out += ' ';
if (it.opts.allErrors) {
    out += ' return { valid: !errors.length, errors: errors }; ';
} else {
    out += ' return { valid: true, errors: [] }; ';
}
out += '}';
return out;
