import {
  CodeGen,
  CodeGenOptions,
  ScopeStore,
  ValueScope,
  _,
  str,
  nil,
  Code,
  Name,
} from "../dist/compile/codegen"
import assert from "assert"

describe("code generation", () => {
  describe("Name", () => {
    it("throws if non-identifies is passed", () => {
      assert.throws(() => new Name("1x"))
      assert.throws(() => new Name("-x"))
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
      assertEqual(str`${x}foo${x}bar${x}`, 'x + "foo" + x + "bar" + x')
      assertEqual(str`foo${x}${x}bar${x}`, '"foo" + x + x + "bar" + x')
    })

    it("connects string expressions removing unnecessary additions", () => {
      const x = _`"foo" + ${new Name("x")} + "bar"`
      const code: Code = str`start ${x} end`
      assertEqual(code, '"start foo" + x + "bar end"')
    })

    it("connects strings with numbers, booleans and nulls removing unnecessary additions", () => {
      assertEqual(str`foo ${1} ${true} ${null} bar`, '"foo 1 true null bar"')
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
        assert.throws(() => gen.if(_`${x} > ${num}`, undefined, () => log("smaller or equal")))
      })

      it("throws exception if `else` clause is used without `if`", () => {
        assert.throws(() => gen.else())
      })

      it("throws exception if `else` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.else())
      })

      it("throws exception if `elseIf` clause is used without `if`", () => {
        assert.throws(() => gen.elseIf(_`${x} > ${num}`))
      })

      it("throws exception if `elseIf` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.elseIf(_`${x} > ${num}`))
      })

      it("throws exception if `endIf` clause is used without `if`", () => {
        assert.throws(() => gen.endIf())
      })

      it("throws exception if `endIf` clause is used in another block", () => {
        gen.func(new Name("f"))
        assert.throws(() => gen.endIf())
      })

      it("renders `if` with negated condition", () => {
        const gt = gen.const("gt", _`${x} > ${num}`)
        gen.ifNot(gt, () => log("smaller or equal"))
        assertEqual(gen, 'const gt0 = x > 0;if(!gt0){console.log("smaller or equal");}')
      })

      it("throws exception if `else if` is used after `else`", () => {
        gen.if(_`${x} > ${num}`)
        log("greater")
        gen.else()
        log("smaller or equal")
        assert.throws(() => gen.elseIf(_`${x} < ${num}`))
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
        assertEqual(gen, "for(let i0=0; i0<5; i0++){console.log(xs[i0]);}")
      })

      it("renders `for-of` statement", () => {
        gen.forOf("x", xs, (x: Name) => gen.code(_`console.log(${x})`))
        assertEqual(gen, "for(const x0 of xs){console.log(x0);}")
      })

      it("renders `for-of` as for with `es5` option", () => {
        const _gen = getGen({es5: true})
        _gen.forOf("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
        assertEqual(_gen, "for(var _i0=0; _i0<xs.length; _i0++){var x0 = xs[_i0];console.log(x0);}")
      })

      it("renders `for-in` statement", () => {
        gen.forIn("x", xs, (x: Name) => gen.code(_`console.log(${x})`))
        assertEqual(gen, "for(const x0 in xs){console.log(x0);}")
      })

      it("renders `for-in` statement as `for-of` with `ownProperties` option", () => {
        const _gen = getGen({ownProperties: true})
        _gen.forIn("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
        assertEqual(_gen, "for(const x0 of Object.keys(xs)){console.log(x0);}")
      })

      it("renders `for-in` statement as `for` with `ownProperties` and `es5` options", () => {
        const _gen = getGen({ownProperties: true, es5: true})
        _gen.forIn("x", xs, (x: Name) => _gen.code(_`console.log(${x})`))
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
        assertEqual(
          gen,
          'function inverse(x0){try{return 1/x0;}catch(e0){console.error("dividing " + x0 + " by 0");throw e0;}}'
        )
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
      assert.deepEqual(gen.getScopeValue("val", 1), {
        _str: "val0",
        prefix: "val",
        scopePath: _`.val[0]`,
        value: {
          ref: 1,
          code: _`1`,
        },
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
