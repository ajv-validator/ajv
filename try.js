var out = '';
out += 'function (data, dataType, dataPath) { \'use strict\'; ';
if (it.opts.allErrors) {
    out += ' var errors = []; ';
}
out += ' ';
var $schemaKeys = Object.keys(it.schema);
$schemaKeys.sort(compareRules);
out += ' ';
var $checkProperties = !it.schema.properties && (it.schema.patternProperties || it.schema.hasOwnProperty('additionalProperties'));
if ($checkProperties) $schemaKeys.push('properties');
out += ' ';
var arr1 = $schemaKeys;
if (arr1) {
    var $key, i1 = -1,
        l1 = arr1.length - 1;
    while (i1 < l1) {
        $key = arr1[i1 += 1];
        out += ' ';
        var $rule = it.RULES[$key];
        out += ' ';
        if ($rule) {
            out += ' var rule = RULES.' + ($key) + ';  if ( !rule.type || rule.type == dataType ) { ';
            if ($rule.inline) {
                out += ' ' + ($rule.code(it)) + ' ';
            } else {
                out += ' ';
                var $it = it.copy(it);
                $it.schema = it.schema[$key];
                $it.schemaPath = it.schemaPath + '.' + $key;
                $it.parentSchema = it.schema;
                $it.parentSchemaPath = it.schemaPath;
                out += ' var result = (' + ($rule.code($it)) + ')(data, dataType, dataPath); ';
            }
            out += ' if (!result.valid) { ';
            if (it.opts.allErrors) {
                out += ' errors.push.apply(errors, result.errors); ';
            } else {
                out += ' return result; ';
            }
            out += ' } } ';
        }
        out += ' ';
    }
}
out += ' ';
if (it.opts.allErrors) {
    out += ' return { valid: !errors.length, errors: errors }; ';
} else {
    out += ' return { valid: true, errors: [] }; ';
}
out += ' ';

function compareRules(key1, key2) {
    var order1 = it.RULES[key1].order,
        order2 = it.RULES[key2].order;
    if (order1 < order2) return -1;
    if (order1 > order2) return +1;
    if (order1 == order2) return 0;
}
}
return out