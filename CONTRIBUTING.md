# Contributing

Thank you for your help making Ajv better! Every contribution is appreciated. If you plan to implement a new feature or some other change please create an issue first, to make sure that your work is not lost.

- [Documentation](#documentation)
- [Issues](#issues)
  - [Bug reports](#bug-reports)
  - [Security vulnerabilities](#security-vulnerabilities)
  - [Change proposals](#changes)
  - [Browser and compatibility issues](#compatibility)
  - [Installation and dependency issues](#installation)
  - [JSON Schema standard](#json-schema)
  - [Ajv usage questions](#usage)
- [Code](#code)
  - [Development](#development)
  - [Pull requests](#pull-requests)
  - [Contributions license](#contributions-license)


## Documentation

Ajv has a lot of features and maintaining documentation takes time. I appreciate the time you spend correcting or clarifying the documentation.


## Issues

Before submitting the issue please search the existing issues and also review [Frequently Asked Questions](https://github.com/epoberezkin/ajv/blob/master/FAQ.md).

I would really appreciate the time you spend providing all the information and reducing both your schema and data to the smallest possible size when they still have the issue. Simplifying the issue also makes it more valuable for other users (in cases it turns out to be an incorrect usage rather than a bug).


#### Bug reports

Please make sure to include the following information in the issue:

1. What version of Ajv are you using? Does the issue happen if you use the latest version?
2. Ajv options object (see https://github.com/epoberezkin/ajv#options).
3. JSON Schema and the data you are validating (please make it as small as possible to reproduce the issue).
4. Your code (please use `options`, `schema` and `data` as variables).
5. Validation result, data AFTER validation, error messages.
6. What results did you expect?

Please include the link to the working code sample at Runkit.com (please clone https://runkit.com/esp/ajv-issue) - it will speed up investigation and fixing.

[Create bug report](https://github.com/epoberezkin/ajv/issues/new?template=bug-or-error-report.md).


#### Security vulnerabilities

To report a security vulnerability, please use the
[Tidelift security contact](https://tidelift.com/security).
Tidelift will coordinate the fix and disclosure.

Please do NOT report security vulnerabilities via GitHub issues.


#### <a name="changes"></a>Change proposals

[Create a proposal](https://github.com/epoberezkin/ajv/issues/new?template=change.md) for a new feature, option or some other improvement.

Please include this information:

1. The version of Ajv you are using.
2. The problem you want to solve.
3. What do you think is the correct solution to problem?
4. Will you be able to implement it?

If you’re requesting a change, it would be helpful to include this as well:

1. What you did.
2. What you would like to happen.
3. What actually happened.

Please include as much details as possible.


#### <a name="compatibility"></a>Browser and compatibility issues

[Create an issue](https://github.com/epoberezkin/ajv/issues/new?template=compatibility.md) to report a compatibility problem that only happens in a particular environment (when your code works correctly in node.js v8+ in linux systems but fails in some other environment).

Please include this information:

1. The version of Ajv you are using.
2. The environment you have the problem with.
3. Your code (please make it as small as possible to reproduce the issue).
4. If your issue is in the browser, please list the other packages loaded in the page in the order they are loaded. Please check if the issue gets resolved (or results change) if you move Ajv bundle closer to the top.
5. Results in node.js v8+.
6. Results and error messages in your platform.


#### <a name="installation"></a>Installation and dependency issues

[Create an issue](https://github.com/epoberezkin/ajv/issues/new?template=installation.md) to report problems that happen during Ajv installation or when Ajv is missing some dependency.

Before submitting the issue, please try the following:
- use the latest stable Node.js and `npm`
- use `yarn` instead of `npm` - the issue can be related to https://github.com/npm/npm/issues/19877
- remove `node_modules` and `package-lock.json` and run install again

If nothing helps, please submit:

1. The version of Ajv you are using
2. Operating system and node.js version
3. Package manager and its version
4. Link to (or contents of) package.json
5. Error messages
6. The output of `npm ls`


#### <a name="json-schema"></a>Using JSON Schema standard

Ajv implements JSON Schema standard draft-04 and draft-06/07.

If it is a general issue related to using the standard keywords included in JSON Schema or implementing some advanced validation logic please ask the question on [Stack Overflow](https://stackoverflow.com/questions/ask?tags=jsonschema,ajv) (my account is [esp](https://stackoverflow.com/users/1816503/esp)) or submitting the question to [JSON-Schema.org](https://github.com/json-schema-org/json-schema-spec/issues/new). Please mention @epoberezkin.


#### <a name="usage"></a>Ajv usage questions

The best place to ask a question about using Ajv is [Gitter chat](https://gitter.im/ajv-validator/ajv).

If the question is advanced, it can be submitted to [Stack Overflow](http://stackoverflow.com/questions/ask?tags=jsonschema,ajv).


## Code

Thanks a lot for considering contributing to Ajv. Many very useful features were created by its users.


#### Development

Running tests:

```bash
npm install
git submodule update --init
npm test
```

The full test suite runs for 3 minutes. If your change is trivial you can run quick test before committing (10 sec) and then disable pre-commit hook:

```bash
npm run test-fast
git commit -nm 'type: message'
```

All validation functions are generated using doT templates in [dot](https://github.com/epoberezkin/ajv/tree/master/lib/dot) folder. Templates are precompiled so doT is not a run-time dependency.

`npm run build` - compiles templates to [dotjs](https://github.com/epoberezkin/ajv/tree/master/lib/dotjs) folder.

`npm run watch` - automatically compiles templates when files in dot folder change


#### Pull requests

To make accepting your changes faster please follow these steps:

1. Submit an [issue with the bug](https://github.com/epoberezkin/ajv/issues/new) or with the proposed change (unless the contribution is to fix the documentation typos and mistakes).
2. Please describe the proposed api and implementation plan (unless the issue is a relatively simple bug and fixing it doesn't change any api).
3. Once agreed, please write as little code as possible to achieve the desired result.
4. Please avoid unnecessary changes, refactoring or changing coding styles as part of your change (unless the change was proposed as refactoring).
5. Please follow the coding conventions even if they are not validated (and/or you use different conventions in your code).
6. Please run the tests before committing your code.
7. If tests fail in Travis after you make a PR please investigate and fix the issue.


#### Contributions license

When contributing the code you confirm that:

1. Your contribution is created by you.
2. You have the right to submit it under the MIT license.
3. You understand and agree that your contribution is public, will be stored indefinitely, can be redistributed as the part of Ajv or another related package under MIT license, modified or completely removed from Ajv.
4. You grant irrevocable MIT license to use your contribution as part of Ajv or another related package.
5. You waive all rights to your contribution.
6. Unless you request otherwise, you can be mentioned as the author of the contribution in the Ajv documentation and change log.
