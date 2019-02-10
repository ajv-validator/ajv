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
const validationError: ajv.ValidationError = new ajv.ValidationError([]);
validationError instanceof ajv.ValidationError;
validationError.ajv === true;
validationError.validation === true;

ajv.MissingRefError.message("", "");
const missingRefError: ajv.MissingRefError = new ajv.MissingRefError("", "", "");
missingRefError instanceof ajv.MissingRefError;
missingRefError.missingRef;
// #endregion
