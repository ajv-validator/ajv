declare function ajv (options?: ajv.Options): ajv.Ajv;

declare namespace ajv {
  interface Ajv {
    compile(schema: Object): ValidateFunction;
    compileAsync(schema: Object, cb: (err: Error, validate: ValidateFunction) => any): void;
    validate(schema: Object | string, data: any): boolean;
    addSchema(schema: Array<Object> | Object, key?: string): void;
    addMetaSchema(schema: Object, key?: string): void;
    validateSchema(schema: Object): boolean;
    getSchema(key: string): ValidateFunction;
    removeSchema(schema: Object | string | RegExp);
    addFormat(name: string, format: string | RegExp | (data: string) => boolean | FormatDefinition): void;
    addKeyword(keyword: string, definition: KeywordDefinition): void;
    errorsText(errors?: Array<ErrorObject>, options?: ErrorsTextOptions);
  }

  interface ValidateFunction {
    (
      data: any,
      dataPath?: string,
      parentData?: Object | Array,
      parentDataProperty?: string | number
    ): boolean;
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
    loadSchema?: (uri: string, cb: (err, schema) => any) => any;
    removeAdditional?: boolean | string;
    useDefaults?: boolean | string;
    coerceTypes?: boolean;
    async?: boolean | string;
    transpile?: string | (code: string) => string;
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

  interface FormatDefinition {
    validate: string | RegExp | (data: string) => boolean;
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
      parentData?: Object | Array,
      parentDataProperty?: string | number
    ): boolean;
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

  interface ErrorParameters {
    maxItems?: MinMaxParam;
    minItems?: MinMaxParam;
    maxLength?: MinMaxParam;
    minLength?: MinMaxParam;
    maxProperties?: MinMaxParam;
    minProperties?: MinMaxParam;
    additionalItems?: MinMaxParam;
    additionalProperties?: AdditionalPropertyParam;
    patternGroups?: PatternGroup[];
    dependencies?: Dependency[];
    format?: Object;
    maximum?: MaximumMinimumParam;
    minimum?: MaximumMinimumParam;
    multipleOf?: MultipleOfParam;
    pattern?: PatternParam;
    required?: RequiredParam;
    type?: TypeParam;
    uniqueItems?: UniqueItemsParam;
    $ref?: RefParam;
  }

  interface MinMaxParam {
    limit: number;
  }

  interface AdditionalPropertyParam {
    additionalProperty: string;
  }

  interface PatternGroup {
    pattern: string;
    reason: string;
    limit: number;
  }

  interface Dependency {
    property: string;
    missingProperty: string;
    deps: string;
    depsCount: number;
  }

  interface MaximumMinimumParam {
    limit: number;
    exclusive: boolean;
    comparison: string;
  }

  interface MultipleOfParam {
    multipleOf: Object;
  }

  interface PatternParam {
    pattern: Object;
  }

  interface RequiredParam {
    missingProperty: string;
  }

  interface TypeParam {
    type: string;
  }

  interface UniqueItemsParam {
    i: number;
    j: number;
  }
  interface RefParam {
    ref: string;
  }
}

export = ajv;
