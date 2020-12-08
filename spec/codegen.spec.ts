import {
  CodeGen,
  CodeGenOptions,
  ScopeStore,
  ValueScope,
  _,
  str,
  nil,
  not,
  Code,
  Name,
} from "../dist/compile/codegen"
import assert = require("assert")

describe("code generation", () => {
  describe("Name", () => {
    it("throws if non-identifier is passed", () => {
      assert.throws(() => new Name("1x"), /name must be a valid identifier/)
      assert.throws(() => new Name("-x"), /name must be a valid identifier/)
      new Name("x")
    })

    it("returns false from emptyStr", () => {
      assert.strictEqual(new Name("x").emptyStr(), false)
    })
  })

  describe("emptyStr", () => {
    it("checks empty string", () => {
      assert.strictEqual(nil.toString(), "")
      assert.strictEqual(nil.emptyStr(), true)
      assert.strictEqual(_`""`.emptyStr(), true)
      assert.strictEqual(_`"foo"`.emptyStr(), false)
    })
  })

  describe("_ tagged template", () => {
    it("quotes strings", () => {
      const x = new Name("x")
      const s = "foo"
      const code = _`${x} = ${s}`
      assertEqual(code, 'x = "foo"')
    })

    it("interpolates Code, numbers, booleans and nulls without quotes", () => {
      const x: Name = new Name("x")
      const expr: Code = _`${true} ? ${1} : ${2}`
      const code: Code = _`${x} = ${expr}; x = ${null}`
      assertEqual(code, "x = true ? 1 : 2; x = null")
    })
  })

  describe("str tagged template", () => {
    it("quotes plain strings", () => {
      const code: Code = str`foo`
      assertEqual(code, '"foo"')
    })

    it("merges strings", () => {
      const x = "-"
      assertEqual(str`${x}foo${x}bar${x}`, '"-foo-bar-"')
    })

    it("creates string expressions with Code", () => {
      const x = new Name("x")
      assertEqual(str`${x}foo${x}bar${x}`, 'x+"foo"+x+"bar"+x')
      assertEqual(str`foo${x}${x}bar${x}`, '"foo"+x+x+"bar"+x')
    })

    it("connects string expressions removing unnecessary additions", () => {
      const x = _`"foo" + ${new Name("x")} + "bar"`
      assertEqual(str`start ${x} end`, '"start foo" + x + "bar end"')
    })

    it("connects strings with numbers, booleans and nulls removing unnecessary additions", () => {
      assertEqual(str`foo ${1} ${true} ${null} bar`, '"foo 1 true null bar"')
    })

    it("preserves code", () => {
      const data = new Name("data")
      const code = _`${data}.replace(/~/g, "~0")`
      assertEqual(str`/${code}`, '"/"+data.replace(/~/g, "~0")')
      assertEqual(str`/${code}/`, '"/"+data.replace(/~/g, "~0")+"/"')
    })
  })

  describe("CodeGen", () => {
    let gen: CodeGen

    beforeEach(() => {
      gen = getGen()
    })

    describe("name declarations", () => {
      it("declares const", () => {
        const x = gen.const("x", 1)
        assert(x instanceof Name)
        assertEqual(gen, "const x0 = 1;")
      })

      it("declares and assigns let", () => {
        gen.let("x", 1)
        assertEqual(gen, "let x0 = 1;")
      })

      it("declares let", () => {
        gen.let("x")
        assertEqual(gen, "let x0;")
      })

      it("declares and assigns var", () => {
        gen.var("x", 1)
        assertEqual(gen, "var x0 = 1;")
      })

      it("adds code", () => {
        const x = "hello"
        gen.code(_`console.log(${x})`)
        gen.code(() => gen.code(_`console.log(${2})`))
        assertEqual(gen, 'console.log("hello");console.log(2);')
      })

      it("returns code for object literal", () => {
        const bar = new Name("bar")
        const code = gen.object(
          [new Name("foo"), 1],
          [bar, bar],
          [new Name("baz"), str`hello`],
          [new Name("bool"), true]
        )
        assertEqual(code, '{foo:1,bar,baz:"hello",bool:true}')
      })
    })

    describe("`if` statement", () => {
      const x = new Name("x")
      const num = 0

      it("renders if/else if/else clauses", () => {
        gen.if(_`${x} > ${num}`)
        log("greater")
        gen.elseIf(_`${x} < ${num}`)
        log("smaller")
        gen.else()
        log("equal")
        gen.endIf()
        gen.optimize()
        assertEqual(
          gen,
          'if(x > 0){console.log("greater");}else if(x < 0){console.log("smaller");}else {console.log("equal");}'
        )
      })

      it("renders `if` statement with `then` and `else` blocks", () => {
        gen.if(
          _`${x} > ${num}`,
          () => log("greater"),
          () => log("smaller or equal")
        )
        gen.optimize()
        assertEqual(
          gen,
          'if(x > 0){console.log("greater");}else {console.log("smaller or equal");}'
        )
      })

      it("renders `if` statement with `then` block", () => {
        gen.if(_`${x} > ${num}`, () => log("greater"))
        assertEqual(gen, 'if(x > 0){console.log("greater");}')
      })

      it("throws exception if `else` block is used without `then` block", () => {
        assert.throws(
          () => gen.if(_`${x} > ${num}`, undefined, () => log("smaller or equal")),
          /"else" body without "then" body/
        )
      })

      it("throws exception if `else` clause is used without `if`", () => {
        assert.throws(() => gen.else(), /"else" without "if"/)
      })

      it("throws exception if `else` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.else(), /"else" without "if"/)
      })

      it("throws exception if `elseIf` clause is used without `if`", () => {
        assert.throws(() => gen.elseIf(_`${x} > ${num}`), /"else" without "if"/)
      })

      it("throws exception if `elseIf` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.elseIf(_`${x} > ${num}`), /"else" without "if"/)
      })

      it("throws exception if `endIf` clause is used without `if`", () => {
        assert.throws(() => gen.endIf(), /not in block "if\/else"/)
      })

      it("throws exception if `endIf` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.endIf(), /not in block "if\/else"/)
      })

      it("renders `if` with negated condition", () => {
        const gt = gen.const("gt", _`${x} > ${num}`)
        gen.if(not(gt), () => log("smaller or equal"))
        assertEqual(gen, 'const gt0 = x > 0;if(!gt0){console.log("smaller or equal");}')
      })

      it("throws exception if `else if` is used after `else`", () => {
        gen.if(_`${x} > ${num}`)
        log("greater")
        gen.else()
        log("smaller or equal")
        assert.throws(() => gen.elseIf(_`${x} < ${num}`), /"else" without "if"/)
      })

      const nestedIfCode =
        'if(x > 0){console.log("greater");}else {if(x < 0){console.log("smaller");}else {console.log("equal");}}'

      it("renders nested if statements", () => {
        gen.if(
          _`${x} > ${num}`,
          () => log("greater"),
          () =>
            gen.if(
              _`${x} < ${num}`,
              () => log("smaller"),
              () => log("equal")
            )
        )
        gen.optimize()
        assertEqual(gen, nestedIfCode)
      })

      it("renders nested if statement with block/endBlock", () => {
        gen.block()
        gen.if(_`${x} > ${num}`)
        log("greater")
        gen.else().if(_`${x} < ${num}`)
        log("smaller")
        gen.else()
        log("equal")
        gen.endBlock()
        gen.optimize()
        assertEqual(gen, nestedIfCode)
      })

      it("renders nested if statement with block callback-style", () => {
        gen.block(() => {
          gen.if(_`${x} > ${num}`)
          log("greater")
          gen.else().if(_`${x} < ${num}`)
          log("smaller")
          gen.else()
          log("equal")
        })
        gen.optimize()
        assertEqual(gen, nestedIfCode)
      })

      function log(comparison: string): void {
        gen.code(_`console.log(${comparison})`)
      }
    })

    describe("for statement", () => {
      const xs = new Name("xs")

      it("renders `for` for a range", () => {
        gen.forRange("i", 0, 5, (i: Name) => gen.code(_`console.log(${xs}[${i}])`))
        gen.optimize()
        assertEqual(gen, "for(let i0=0; i0<5; i0++){console.log(xs[i0]);}")
      })

      it("renders `for-of` statement", () => {
        gen.forOf("x", xs, (x: Name) => gen.code(_`console.log(${x})`))
        gen.optimize()
        assertEqual(gen, "for(const x0 of xs){console.log(x0);}")
      })

      it("renders `for-of` as for with `es5` option", () => {
        const _gen = getGen({es5: true})
        _gen.forOf("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
        _gen.optimize()
        assertEqual(_gen, "for(var _i0=0; _i0<xs.length; _i0++){var x0 = xs[_i0];console.log(x0);}")
      })

      it("renders `for-in` statement", () => {
        gen.forIn("x", xs, (x: Name) => gen.code(_`console.log(${x})`))
        gen.optimize()
        assertEqual(gen, "for(const x0 in xs){console.log(x0);}")
      })

      it("renders `for-in` statement as `for-of` with `ownProperties` option", () => {
        const _gen = getGen({ownProperties: true})
        _gen.forIn("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
        _gen.optimize()
        assertEqual(_gen, "for(const x0 of Object.keys(xs)){console.log(x0);}")
      })

      it("renders `for-in` statement as `for` with `ownProperties` and `es5` options", () => {
        const _gen = getGen({ownProperties: true, es5: true})
        _gen.forIn("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
        _gen.optimize()
        assertEqual(
          _gen,
          "var _arr0 = Object.keys(xs);for(var _i0=0; _i0<_arr0.length; _i0++){var x0 = _arr0[_i0];console.log(x0);}"
        )
      })

      const nestendFor =
        "let i0 = arr0.length;let j0;outer0:for(;i0--;){for(j0=i0;j0--;){if(arr0[i0] === arr0[j0]){break outer0;}}}"

      it("renders generic clause `for` with `label` and `break` in self-balancing block", () => {
        const outer = gen.name("outer")
        const arr = gen.name("arr")
        const i = gen.let("i", _`${arr}.length`)
        const j = gen.let("j")
        gen
          .block()
          .label(outer)
          .for(_`;${i}--;`)
          .for(_`${j}=${i};${j}--;`)
          .if(_`${arr}[${i}] === ${arr}[${j}]`)
          .break(outer)
          .endBlock()
        gen.optimize()
        assertEqual(gen, nestendFor)
      })

      it("renders generic statement `for` with `label` and `break`", () => {
        const outer = gen.name("outer")
        const arr = gen.name("arr")
        const i = gen.let("i", _`${arr}.length`)
        const j = gen.let("j")
        gen
          .label(outer)
          .for(_`;${i}--;`, () =>
            gen.for(_`${j}=${i};${j}--;`, () =>
              gen.if(_`${arr}[${i}] === ${arr}[${j}]`, () => gen.break(outer))
            )
          )
        gen.optimize()
        assertEqual(gen, nestendFor)
      })
    })

    describe("function definition", () => {
      it("renders function with `return` and `try` statements", () => {
        const inverse = new Name("inverse")
        const x = gen.name("x")
        gen
          .func(inverse, x)
          .try(
            () => gen.return(_`1/${x}`),
            (e) => gen.code(_`console.error(${str`dividing ${x} by 0`})`).throw(e)
          )
          .endFunc()
        gen.optimize()
        assertEqual(
          gen,
          'function inverse(x0){try{return 1/x0;}catch(e0){console.error("dividing "+x0+" by 0");throw e0;}}'
        )
      })
    })

    describe("`try` statement", () => {
      it("should render `try/catch/finally`", () => {
        gen.try(_`log("try")`, (e) => gen.code(_`log(${e})`), _`log("fin")`)
        gen.optimize()
        assertEqual(gen, 'try{log("try");}catch(e0){log(e0);}finally{log("fin");}')
      })

      it("should render `try/finally`", () => {
        gen.try(_`log("try")`, undefined, _`log("fin")`)
        gen.optimize()
        assertEqual(gen, 'try{log("try");}finally{log("fin");}')
      })
    })

    describe("code optimization", () => {
      const valid = new Name("valid")

      it("should remove empty `if`", () => {
        gen.if(valid).endIf()
        assertEqual(gen, "if(valid){}")
        gen.optimize()
        assertEqual(gen, "")
      })

      it("should remove empty `else`", () => {
        gen
          .if(valid)
          .code(_`log("if")`)
          .else()
          .endIf()
        assertEqual(gen, 'if(valid){log("if");}else {}')
        gen.optimize()
        assertEqual(gen, 'if(valid){log("if");}')
      })

      it("should remove `else` from always valid `if` condition", () => {
        gen
          .if(true)
          .code(_`log("if")`)
          .else()
          .code(_`log("else")`)
          .endIf()
        assertEqual(gen, 'if(true){log("if");}else {log("else");}')
        gen.optimize()
        assertEqual(gen, 'log("if");')
      })

      it("should remove `if` from always invalid `if` condition", () => {
        gen
          .if(false)
          .code(_`log("if")`)
          .else()
          .code(_`log("else")`)
          .endIf()
        assertEqual(gen, 'if(false){log("if");}else {log("else");}')
        gen.optimize()
        assertEqual(gen, 'log("else");')
      })

      it("should remove empty `if` and keep `else`", () => {
        gen
          .if(valid)
          .else()
          .code(_`log("else")`)
          .endIf()
        assertEqual(gen, 'if(valid){}else {log("else");}')
        gen.optimize()
        assertEqual(gen, 'if(!valid){log("else");}')
      })

      it("should remove empty `for`", () => {
        gen.for(_`const x of xs`).endFor()
        assertEqual(gen, "for(const x of xs){}")
        gen.optimize()
        assertEqual(gen, "")
      })

      it("should remove unused names", () => {
        gen.const("x", 0)
        assertEqual(gen, "const x0 = 0;")
        gen.optimize()
        assertEqual(gen, "")
      })

      it("should remove names used in removed branches", () => {
        const x = gen.const("x", 0)
        gen.if(_`${x} === 0`).endIf()
        assertEqual(gen, "const x0 = 0;if(x0 === 0){}")
        gen.optimize()
        assertEqual(gen, "")
      })

      it('should replace names with "constant" expressions if used only once', () => {
        const data = new Name("data")
        const x = gen.const("x", _`${data}.prop`, true) // true means that the expression `data.prop` is "constant"
        gen
          .if(_`${x} === 0`)
          .code(_`log()`)
          .endIf()
        assertEqual(gen, "const x0 = data.prop;if(x0 === 0){log();}")
        gen.optimize()
        assertEqual(gen, "if(data.prop === 0){log();}")
      })
    })
  })

  describe("external scope", () => {
    let gen: CodeGen
    let scope: ScopeStore

    beforeEach(() => {
      scope = {}
      gen = new CodeGen(new ValueScope({scope}))
    })

    it("defines and renders value references and values code", () => {
      gen.scopeValue("val", {ref: 1, code: _`1`})
      assert.deepEqual(gen.getScopeValue("val", 1)?.value, {
        ref: 1,
        code: _`1`,
      })
      assertEqual(gen.scopeRefs(new Name("scope")), "const val0 = scope.val[0];")
      assertEqual(gen.scopeCode(), "const val0 = 1;")
    })
  })
})

function assertEqual(code: Code | CodeGen, s: string): void {
  assert.strictEqual(code.toString(), s)
}

function getGen(opts?: CodeGenOptions): CodeGen {
  return new CodeGen(new ValueScope({scope: {}}), opts)
}
