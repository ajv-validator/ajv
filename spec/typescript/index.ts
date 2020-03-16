import ajv = require('../..');

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
};

let result = instance.validate('', data);

if (typeof result === 'boolean') {
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

// async
const validatorAsync = instance.compile({ $async: true });
const resultAsync = validatorAsync(data);
resultAsync.then(value => {
	data = value;
});

// sync
const validatorSync = instance.compile({});
const resultSync = validatorSync(data);
if (resultSync) {
	console.log(resultSync);
}


// generic
const dataGeneric = <any>{};

const validatorGeneric = instance.compile<{ foo: number }>({
	type: 'object',
	properties: {
		foo: {
			type: 'number',
		},
	},
});

if (validatorGeneric(dataGeneric)) {
    data = dataGeneric;
}
// #endregion compile()

// #region errors
const validationError: ajv.ValidationError = new ajv.ValidationError([]);
validationError instanceof ajv.ValidationError;
validationError.ajv === true;
validationError.validation === true;

ajv.MissingRefError.message('', '');
const missingRefError: ajv.MissingRefError = new ajv.MissingRefError(
	'',
	'',
	''
);
missingRefError instanceof ajv.MissingRefError;
missingRefError.missingRef;
// #endregion
