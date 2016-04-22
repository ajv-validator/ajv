declare function ajv (options?: ajv.Options): ajv.Ajv;

declare namespace ajv {
  interface Ajv {
    validate(schemaKeyRef: Object | string, data: any): boolean;
    compile(schema: Object): ValidateFunction;
    compileAsync(schema: Object, callback: (err: Error, validate: ValidateFunction) => any): void;
    addSchema(schema: Array<Object> | Object, key?: string): void;
    addMetaSchema(schema: Object, key?: string): void;
    validateSchema(schema: Object): boolean;
    getSchema(keyRef: string): ValidateFunction;
    removeSchema(schemaKeyRef?: Object | string | RegExp): void;
    addFormat(name: string, format: FormatValidator | FormatDefinition): void;
    addKeyword(keyword: string, definition: KeywordDefinition): void;
    errorsText(errors?: Array<ErrorObject>, options?: ErrorsTextOptions): string;
  }

  interface Thenable <R> {
    then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
  }

  interface ValidateFunction {
    (
      data: any,
      dataPath?: string,
      parentData?: Object | Array<any>,
      parentDataProperty?: string | number
    ): boolean | Thenable<boolean>;
    errors?: Array<ErrorObject>;
  }

  interface Options {
    v5?: boolean;
    allErrors?: boolean;
    verbose?: boolean;
    jsonPointers?: boolean;
    uniqueItems?: boolean;
    unicode?: boolean;
    format?: string;
    formats?: Object;
    schemas?: Array<Object> | Object;
    missingRefs?: boolean | string;
    loadSchema?: (uri: string, cb: (err: Error, schema: Object) => any) => any;
    removeAdditional?: boolean | string;
    useDefaults?: boolean | string;
    coerceTypes?: boolean;
    async?: boolean | string;
    transpile?: string | ((code: string) => string);
    meta?: boolean | Object;
    validateSchema?: boolean | string;
    addUsedSchema?: boolean;
    inlineRefs?: boolean | number;
    passContext?: boolean;
    loopRequired?: number;
    multipleOfPrecision?: number;
    errorDataPath?: string;
    messages?: boolean;
    beautify?: boolean | Object;
    cache?: Object;
  }

  type FormatValidator = string | RegExp | ((data: string) => boolean);

  interface FormatDefinition {
    validate: FormatValidator;
    compare: (data1: string, data2: string) => number;
    async?: boolean;
  }

  interface KeywordDefinition {
    type?: string | Array<string>;
    async?: boolean;
    errors?: boolean | string;
    // schema: false makes validate not to expect schema (ValidateFunction)
    schema?: boolean;
    // one and only one of the following properties should be present
    validate?: ValidateFunction | SchemaValidateFunction;
    compile?: (schema: Object, parentSchema: Object) => ValidateFunction;
    macro?: (schema: Object, parentSchema: Object) => Object;
    inline?: (it: Object, keyword: string, schema: Object, parentSchema: Object) => string;
  }

  interface SchemaValidateFunction {
    (
      schema: Object,
      data: any,
      parentSchema?: Object,
      dataPath?: string,
      parentData?: Object | Array<any>,
      parentDataProperty?: string | number
    ): boolean | Thenable<boolean>;
    errors?: Array<ErrorObject>;
  }

  interface ErrorsTextOptions {
    separator?: string;
    dataVar?: string;
  }

  interface ErrorObject {
    keyword: string;
    dataPath: string;
    schemaPath: string;
    params: ErrorParameters;
    // Excluded if messages set to false.
    message?: string;
    // These are added with the `verbose` option.
    schema?: Object;
    parentSchema?: Object;
    data?: any;
  }

  type ErrorParameters = RefParams | LimitParams | AdditionalPropertiesParams |
                          DependenciesParams | FormatParams | ComparisonParams |
                          MultipleOfParams | PatternParams | RequiredParams |
                          TypeParams | UniqueItemsParams | CustomParams |
                          PatternGroupsParams | PatternRequiredParams |
                          SwitchParams | NoParams;

  interface RefParams {
    ref: string;
  }

  interface LimitParams {
    limit: number;
  }

  interface AdditionalPropertiesParams {
    additionalProperty: string;
  }

  interface DependenciesParams {
    property: string;
    missingProperty: string;
    depsCount: number;
    deps: string;
  }

  interface FormatParams {
    format: string
  }

  interface ComparisonParams {
    comparison: string;
    limit: number | string;
    exclusive: boolean;
  }

  interface MultipleOfParams {
    multipleOf: number;
  }

  interface PatternParams {
    pattern: string;
  }

  interface RequiredParams {
    missingProperty: string;
  }

  interface TypeParams {
    type: string;
  }

  interface UniqueItemsParams {
    i: number;
    j: number;
  }

  interface CustomParams {
    keyword: string;
  }

  interface PatternGroupsParams {
    reason: string;
    limit: number;
    pattern: string;
  }

  interface PatternRequiredParams {
    missingPattern: string;
  }

  interface SwitchParams {
    caseIndex: number;
  }

  interface NoParams {}
}

export = ajv;
