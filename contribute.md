---
page_name: contribute
title: Ajv - Contributing Guidelines
layout: main
---
# Contributing

Thank you for your help making Ajv better!

- [Submitting issues](#submitting-issues)
  - [Bug reports](#bug-reports)
  - [Change proposals](#changes)
  - [Browser and compatibility issues](#compatibility)
  - [JSON schema standard](#json-schema)
  - [Ajv usage questions](#usage)
- [Contibuting code](#contibuting-code)
  - [Development](#development)
  - [Pull requests](#pull-requests)
  - [Contributions license](#contributions-license)


## Submitting issues

Before submitting the issue please search the existing issues and also review [Frequently Asked Questions](faq.html).

I would really appreciate the time you spend providing all the information and reducing both your schema and data to the smallest possible size when they still have the issue. Simplifying the issue also makes it more valuable for other users (in cases it turns out to be an incorrect usage rather than a bug).


#### Bug reports

Please make sure to include the following information in the issue:

1. What version of Ajv are you using? Does the issue happen if you use the latest version?
2. Ajv options object (see /ajv#options).
3. JSON schema and the data you are validating (please make it as small as possible to reproduce the issue).
4. Your code (please use `options`, `schema` and `data` as variables).
5. Validation result, data AFTER validation, error messages.
6. What results did you expect?

[Create bug report](https://github.com/epoberezkin/ajv/issues/new).


#### <a name="changes"></a>Change proposals

[Create a proposal](https://github.com/epoberezkin/ajv/issues/new?body=**What%20version%20of%20Ajv%20you%20are%20you%20using%3F**%0A%0A**What%20problem%20do%20you%20want%20to%20solve%3F**%0A%0A**What%20do%20you%20think%20is%20the%20correct%20solution%20to%20problem?**%0A%0A**Will%20you%20be%20able%20to%20implement%20it%3F**%0A%0A) for a new feature, option or some other improvement.

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

[Create an issue](https://github.com/epoberezkin/ajv/issues/new?body=**The version of Ajv you are using**%0A%0A**The environment you have the problem with.**%0A%0A**Your code (please make it as small as possible to reproduce the issue).**%0A%0A**If your issue is in the browser, please list the other packages loaded in the page in the order they are loaded. Please check if the issue gets resolved (or results change) if you move Ajv bundle closer to the top.**%0A%0A**Results in node.js v4.**%0A%0A**Results and error messages in your platform.**%0A%0A) to report a compatibility problem that only happens in a particular environemnt (when your code works correctly in node.js v4 in linux systems but fails in some other environment).

Please include this information:

1. The version of Ajv you are using.
2. The environment you have the problem with.
3. Your code (please make it as small as possible to reproduce the issue).
4. If your issue is in the browser, please list the other packages loaded in the page in the order they are loaded. Please check if the issue gets resolved (or results change) if you move Ajv bundle closer to the top.
5. Results in node.js v4.
6. Results and error messages in your platform.


#### <a name="json-schema"></a>Using JSON schema standard

Ajv implements JSON schema standard draft 4 and the proposed extensions for the next version of the standard (available when you use the option `v5: true`).

If the issue is related to using v5 extensions please submit it as a [bug report](https://github.com/epoberezkin/ajv/issues/new).

If it is a general issue related to using the standard keywords included in JSON Schema or implementing some advanced validation logic please ask the question on [Stack Overflow](http://stackoverflow.com/questions/ask?tags=jsonschema,ajv) (my account is [esp](http://stackoverflow.com/users/1816503/esp)) or submitting the question to [JSON-Schema.org](https://github.com/json-schema-org/json-schema-spec/issues/new). Please mention @epoberezkin.


#### <a name="usage"></a>Ajv usage questions

The best place to ask a question about using Ajv is [Gitter chat](https://gitter.im/ajv-validator/ajv).
If the question is advanced, it can be submitted to [Stack Overflow](http://stackoverflow.com/questions/ask?tags=jsonschema,ajv).


## Contibuting code

Thanks a lot for considering contributing to Ajv. Many very useful features were created by its users.

#### Development

Running tests:

```
npm install
git submodule update --init
npm test
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
