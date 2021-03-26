---
permalink: /contributing
---

# Contributing guide

Thank you for your help making Ajv better! Every contribution is appreciated. There are many areas where you can contribute.

::: tip Submit issue first
If you plan to implement a new feature or some other change please create an issue first, to make sure that your work is not lost.
:::

[[toc]]

## Documentation

Ajv has a lot of features and maintaining documentation takes time. If anything is unclear, or could be explained better, we appreciate the time you spend correcting or clarifying it.

There is a link in the bottom of each website page to quickly edit it.

## Issues

Before submitting the issue:

- Search the existing issues
- Review [Frequently Asked Questions](./docs/faq.md).
- Provide all the relevant information, reducing both your schema and data to the smallest possible size when they still have the issue.

We value simplicity - simplifying the example that shows the issue makes it more valuable for other users. This process helps us reduce situations where an error is occurring due to incorrect usage rather than a bug.

### Bug reports

Please make sure to include the following information in the issue:

1. What version of Ajv are you using?
2. Does the issue happen if you use the latest version?
3. Ajv [options object](./docs/options)
4. Schema and the data you are validating (please make it as small as possible to reproduce the issue).
5. Your code sample (please use `options`, `schema` and `data` as variables).
6. Validation result, data AFTER validation, error messages.
7. What results did you expect?

To speed up investigation and fixes, please include the link to the working code sample at runkit.com (please clone https://runkit.com/esp/ajv-issue).

[Create bug report](https://github.com/ajv-validator/ajv/issues/new?template=bug-or-error-report.md).

### Security vulnerabilities

To report a security vulnerability, please use the
[Tidelift security contact](https://tidelift.com/security).
Tidelift will coordinate the fix and disclosure.

Please do NOT report security vulnerabilities via GitHub issues.

### <a name="changes"></a>Change proposals

[Create a proposal](https://github.com/ajv-validator/ajv/issues/new?template=change.md) for a new feature, option or some other improvement.

Please include this information:

1. The version of Ajv you are using.
2. The problem you want to solve.
3. Your solution to the problem.
4. Would you like to implement it?

If you’re requesting a change, it would be helpful to include this as well:

1. What you did.
2. What happened.
3. What you would like to happen.

Please include as much details as possible - the more information, the better.

### <a name="compatibility"></a>Browser and compatibility issues

[Create an issue](https://github.com/ajv-validator/ajv/issues/new?template=compatibility.md) to report a compatibility problem that only happens in a particular environment (when your code works correctly in the latest stable Node.js in linux systems but fails in some other environment).

Please include this information:

1. The version of Ajv you are using.
2. The environment you have the problem with.
3. Your code (please make it as small as possible to reproduce the issue).
4. If your issue is in the browser, please list the other packages loaded in the page in the order they are loaded. Please check if the issue gets resolved (or results change) if you move Ajv bundle closer to the top.
5. Results in the latest stable Node.js.
6. Results and error messages in your platform.

### <a name="installation"></a>Installation and dependency issues

[Create an issue](https://github.com/ajv-validator/ajv/issues/new?template=installation.md) to report problems that happen during Ajv installation or when Ajv is missing some dependency.

Before submitting the issue, please try the following:

- use the latest stable Node.js and `npm`
- try using `yarn` instead of `npm` - the issue can be related to https://github.com/npm/npm/issues/19877
- remove `node_modules` and `package-lock.json` and run `npm install` again

If nothing helps, please submit:

1. The version of Ajv you are using
2. Operating system and Node.js version
3. Package manager and its version
4. Link to (or contents of) package.json and package-lock.json
5. Error messages
6. The output of `npm ls`

### <a name="json-schema"></a>Using JSON Schema standard

Ajv implements JSON Schema standard draft-04 and draft-06/07.

If it is a general issue related to using the standard keywords included in JSON Schema specification or implementing some advanced validation logic please ask the question on [Stack Overflow](https://stackoverflow.com/questions/ask?tags=jsonschema,ajv) (my account is [esp](https://stackoverflow.com/users/1816503/esp)) or submit the question to [json-schema.org](https://github.com/json-schema-org/json-schema-spec/issues/new). Please mention @epoberezkin.

### <a name="usage"></a>Ajv usage questions

The best place to ask a question about using Ajv is [Gitter chat](https://gitter.im/ajv-validator/ajv).

If the question is advanced, it can be submitted to [Stack Overflow](http://stackoverflow.com/questions/ask?tags=jsonschema,ajv).

## Code

Thanks a lot for considering contributing to Ajv! Our users have created many great features, and we look forward to your contributions.

For help navigating the code, please review the [Code components](./docs/components.md) document.

#### Development

Running tests:

```bash
npm install
git submodule update --init
npm test
```

`npm run build` - compiles typescript to dist folder.

`npm run watch` - automatically compiles typescript when files on lib folder changes.

#### Pull requests

We want to iterate on the code efficiently. To speed up the process, please follow these steps:

1. Submit an [issue with the bug](https://github.com/ajv-validator/ajv/issues/new) or with the proposed change (unless the contribution is to fix the documentation typos and mistakes).
2. Describe the proposed api and implementation plan (unless the issue is a relatively simple bug and fixing it doesn't change any api).
3. Once agreed, please write as little code as possible to achieve the desired result. We are passionate about keeping our library size optimized.
4. Please add the tests both for the added feature and, if you are submitting an option, for the existing behaviour when this option is turned off or not passed.
5. Please avoid unnecessary changes, refactoring or changing coding styles as part of your change (unless the change was proposed as refactoring).
6. Follow the coding conventions even if they are not validated.
7. Please run the tests before committing your code.
8. If tests fail in CI build after you make a PR please investigate and fix the issue.

#### Contributions license

When contributing the code you confirm that:

1. Your contribution is created by you.
2. You have the right to submit it under the MIT license.
3. You understand and agree that your contribution is public, will be stored indefinitely, can be redistributed as the part of Ajv or another related package under MIT license, modified or completely removed from Ajv.
4. You grant irrevocable MIT license to use your contribution as part of Ajv or any other package.
5. You waive all rights to your contribution.
6. Unless you request otherwise, you can be mentioned as the author of the contribution in the Ajv documentation and change log.
