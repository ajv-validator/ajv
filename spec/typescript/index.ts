import ajv = require("../..");

// #region new()
const options: ajv.Options = {
    verbose: true,
};

let instance: ajv.Ajv;

instance = ajv();
instance = ajv(options);

instance = new ajv();
instance = new ajv(options);
// #endregion new()

// #region validate()
let data = {
    foo: 42,
}

let result = instance.validate("", data);

if (typeof result === "boolean") {
    // sync
    console.log(result);
} else {
    // async
    result.then(value => {
        data = value;
    });
}
// #endregion validate()

// #region compile()
const validator = instance.compile({});
result = validator(data);

if (typeof result === "boolean") {
    // sync
    console.log(result);
} else {
    // async
    result.then(value => {
        data = value;
    });
}
// #endregion compile()

// #region errors
const validationError: ajv.ValidationError = new ajv.ValidationError([{
    dataPath: ".someKey",
    keyword: "enum",
    params: { allowedValues: ["1", "2", "3"] },
    schemaPath: "",
}]);
validationError instanceof ajv.ValidationError;
validationError.ajv === true;
validationError.validation === true;
const firstError = validationError.errors[0];
switch (firstError.keyword) {
    case "false schema":
        {}; break;
    case "$ref":
        firstError.params.ref; break;
    case "additionalItems":
        firstError.params.limit; break;
    case "additionalProperties":
        firstError.params.additionalProperty; break;
    case "anyOf":
        {}; break;
    case "const":
        firstError.params.allowedValues; break;
    case "contains":
        {}; break;
    case "dependencies":
        firstError.params.deps;
        firstError.params.depsCount;
        firstError.params.missingProperty;
        firstError.params.property;
        break;
    case "enum":
        firstError.params.allowedValues; break;
    case "format":
        firstError.params.format; break;
    case "if":
        firstError.params.failingKeyword; break;
    case "_limit":
        firstError.params.comparison;
        firstError.params.exclusive;
        firstError.params.limit;
        break;
    case "_exclusiveLimit":
        {}; break;
    case "_limitItems":
        firstError.params.limit; break;
    case "_limitLength":
        firstError.params.limit; break;
    case "_limitProperties":
        firstError.params.limit; break;
    case "multipleOf":
        firstError.params.multipleOf; break;
    case "not":
        {}; break;
    case "oneOf":
        firstError.params.passingSchemas; break;
    case "pattern":
        firstError.params.pattern; break;
    case "propertyNames":
        firstError.params.propertyName;
        firstError.propertyName;
        break;
    case "required":
        firstError.params.missingProperty; break;
    case "type":
        firstError.params.type; break;
    case "uniqueItems":
        firstError.params.i;
        firstError.params.j;
        break;
    case "custom":
        firstError.params.keyword; break;
    case "patternRequired":
        firstError.params.missingPattern; break;
    case "switch":
        firstError.params.caseIndex; break;
    case "_formatLimit":
        firstError.params.comparison;
        firstError.params.exclusive;
        firstError.params.limit;
        break;
    case "_formatExclusiveLimit":
        {}; break;
}

ajv.MissingRefError.message("", "");
const missingRefError: ajv.MissingRefError = new ajv.MissingRefError("", "", "");
missingRefError instanceof ajv.MissingRefError;
missingRefError.missingRef;
// #endregion
