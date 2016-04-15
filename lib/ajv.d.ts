declare function ajv (options?: ajv.Options): ajv.Ajv;

declare namespace ajv {
  interface Ajv {
    compile(schema: Object): ValidateFunction;
    compileAsync(schema: Object, cb: (err: any, validate: ValidateFunction) => any): void;
    validate(schema: Object | string, data: any): boolean;
    addSchema(schema: Array<Object> | Object, key?: string): void;
    addMetaSchema(schema: Object, key?: string): void;
    validateSchema(schema: Object): boolean;
    getSchema(key: string): ValidateFunction;
    removeSchema(schema: Object|string);
    addFormat(name: string, format: RegExp|Function|Object|string): void;
    addKeyword(keyword: string, definition: Object): void;
    errorsText(errors?: Array<Object>, options?: Object);
  }

  interface ValidateFunction {
    (data: Object | string): boolean;
    errors?: Array<ErrorObject>;
  }

  interface Options {
    allErrors?: boolean;
    removeAdditional?: boolean;
    useDefaults?: boolean;
    coerceTypes?: boolean;
    verbose?: boolean;
    format?: string;
    formats?: Object;
    schemas?: Object;
    meta?: boolean;
    validateSchema?: boolean;
    addUsedSchema?: boolean;
    inlineRefs?: boolean;
    loopRequired?: number;
    multipleOfPrecision?: boolean;
    missingRefs?: boolean;
    loadSchema?: (uri, cb: (err, schema) => any) => any;
    uniqueItems?: boolean;
    unicode?: boolean;
    beautify?: boolean;
    cache?: any;
    errorDataPath?: string;
    jsonPointers?: boolean;
    messages?: boolean;
    v5?: boolean;
  }

  interface ErrorsOptions {
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
    data?: Object;
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
