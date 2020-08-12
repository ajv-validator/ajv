import {KeywordErrorDefinition, CompilationContext, KeywordContext} from "../../types"
import {reportError} from "../errors"

const boolError: KeywordErrorDefinition = {
  message: () => '"boolean schema is false"',
  params: () => "{}",
}

export function booleanOrEmptySchema(it: CompilationContext): void {
  const {gen, isTop, schema, level} = it
  if (isTop) {
    if (schema === false) {
      falseSchemaError(it, false)
    } else if (schema.$async === true) {
      gen.code("return data;")
    } else {
      gen.code("validate.errors = null; return true;")
    }
    gen.code(
      `};
      return validate;`
    )
  } else {
    if (schema === false) {
      gen.code(`var valid${level} = false;`) // TODO level, var
      falseSchemaError(it)
    } else {
      gen.code(`var valid${level} = true;`) // TODO level, var
    }
  }

  // if (schema === false) {
  //   if (!isTop) {
  //     gen.code(`var valid${level} = false;`) // TODO level, var
  //   }
  //   // TODO probably some other interface should be used for non-keyword validation errors...
  //   falseSchemaError(it, !isTop)
  // } else {
  //   if (isTop) {
  //     gen.code(schema.$async === true ? `return data;` : `validate.errors = null; return true;`)
  //   } else {
  //     gen.code(`var valid${level} = true;`) // TODO level, var
  //   }
  // }
  // if (isTop) {
  //   gen.code(
  //     `};
  //     return validate;`
  //   )
  // }
}

function falseSchemaError(it: CompilationContext, allErrors?: boolean) {
  const {gen, dataLevel} = it
  // TODO maybe some other interface should be used for non-keyword validation errors...
  const cxt: KeywordContext = {
    gen,
    fail: exception,
    ok: exception,
    errorParams: exception,
    keyword: "false schema",
    data: "data" + (dataLevel || ""),
    $data: false,
    schema: false,
    schemaCode: false,
    schemaValue: false,
    parentSchema: false,
    it,
  }
  reportError(cxt, boolError, allErrors)
}

function exception() {
  throw new Error("this function can only be used in keyword")
}

// {{ var $keyword = 'false schema'; }}
//   {{# def.setupKeyword }}
//   {{? it.schema === false}}
//     {{? it.isTop}}
//       {{ $breakOnError = true; }}
//     {{??}}
//       var {{=$valid}} = false;
//     {{?}}
//     {{# def.error:'false schema' }}
//   {{??}}
//     {{? it.isTop}}
//       {{? $async }}
//         return data;
//       {{??}}
//         validate.errors = null;
//         return true;
//       {{?}}
//     {{??}}
//       var {{=$valid}} = true;
//     {{?}}
//   {{?}}

//   {{? it.isTop}}
//     };
//     return validate;
//   {{?}}

//   {{ return out; }}
// {{?}}
