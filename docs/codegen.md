# Code generation

Starting from v7 Ajv uses [CodeGen module](../lib/compile/codegen/index.ts) that replaced [doT](https://github.com/olado/dot) templates used earlier.

The motivations for this change:

- doT templates were difficult to maintain and to change, particularly for the occasional contributors.
- they discouraged modularity within validation keywords code and also led to implicit dependancies between different parts of code.
- they had risks of remote code execution in case untrusted schemas were used, even though all identified issues were patched.
- ES6 template literals that are now widely supported offer a great alternative to both ASTs and to plain string concatenation - this option was not available when Ajv started.

## Safe code generation

CodeGen module defines two tagged templates that should be passed to all code generation methods and used in other tagged templates:

- `_` - to create instances of private \_Code class that will not be escaped when used in code or other tagged templates.
- `str` - to create code for string expressions.

For example, this code:

```typescript
const x = 0
// Name is a subclass of _Code that can be safely used in code - it only allows valid identifiers
// gen.const creates a unique variable name with the prefix "num".
const num: Name = gen.const("num", 5)
gen.if(
  // _`...` returns the instance of _Code with safe interpolation of `num` and `x`.
  // if `x` was a string, it would be inserted into code as a quoted string value rather than as a code fragment,
  // so if `x` contained some code, it would not be executed.
  _`${num} > ${x}`,
  () => log("greater"),
  () => log("smaller or equal")
)

function log(comparison: string): void {
  // msg creates a string expression with concatenation - see generated code below
  // type Code = _Code | Name, _Code can only be constructed with template literals
  const msg: Code = str`${num} is ${comparison} than ${x}`
  // msg is _Code instance, so it will be inserted via another template without quotes
  gen.code(_`console log(${msg})`)
}
```

generates this javascript code:

```javascript
const num1 = 5
if (num1 > 0) {
  console.log(num + " is greater than " + x)
} else {
  console.log(num + " is smaller than " + x)
}
```

`.const`, `.if` and `.code` above are methods of CodeGen class that generate code inside class instance `gen` - see [source code](../lib/compile/codegen/index.ts) for all available methods.

These methods only accept instances of private class `_Code`, other values will be rejected by Typescript compiler - the risk to pass unsafe string is mitigated on type level.

If a string is used in template literals, it will be wrapped in quotes - the generated code could be invalid, but it prevents the risk of code execution that atacker could pass via untrusted schema as a string value that will be interpolated. Also see the comment in the example.

Currently CodeGen class does safe append-only string concatenation (without any code substitutions that would present risks of malicious code execution). In the next Ajv versions CodeGen class API will allow implementing code optimizations (e.g., removing empty branches and unused variable declarations) without changing the main Ajv code, purely by switching to lightweight syntax trees in the internal class code.

## User-defined keywords

While tagged template literals wrap passed strings based on their run-time values, CodeGen class methods rely on types to ensure safety of passed parameters - there is no run-time checks that the passed value is an instance of \_Code class.

It is strongly recommended to define addiitonal keywords only with Typescript - using plain typescript would still allow passing unsafe strings to code generation methods.
