/* eslint-disable @typescript-eslint/no-empty-interface */
export type SomeJSONSchema = JSONSchemaType<Known, true>

export type PartialSchema<T> = Partial<JSONSchemaType<T, true>>

type JSONType<T extends string, _partial extends boolean> = _partial extends true
  ? T | undefined
  : T

interface NumberKeywords {
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
  format?: string
}

interface StringKeywords {
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
}

export type JSONSchemaType<T, _partial extends boolean = false> = (
  | // these two unions allow arbitrary unions of types
  {
      anyOf: readonly JSONSchemaType<T, _partial>[]
    }
  | {
      oneOf: readonly JSONSchemaType<T, _partial>[]
    }
  // this union allows for { type: (primitive)[] } style schemas
  | ({
      type: (T extends number
        ? JSONType<"number" | "integer", _partial>
        : T extends string
        ? JSONType<"string", _partial>
        : T extends boolean
        ? JSONType<"boolean", _partial>
        : never)[]
    } & (T extends number
      ? NumberKeywords
      : T extends string
      ? StringKeywords
      : T extends boolean
      ? unknown
      : never))
  // this covers "normal" types; it's last so typescript looks to it first for errors
  | ((T extends number
      ? {
          type: JSONType<"number" | "integer", _partial>
        } & NumberKeywords
      : T extends string
      ? {
          type: JSONType<"string", _partial>
        } & StringKeywords
      : T extends boolean
      ? {
          type: "boolean"
        }
      : T extends [any, ...any[]]
      ? {
          // JSON AnySchema for tuple
          type: JSONType<"array", _partial>
          items: {
            readonly [K in keyof T]-?: JSONSchemaType<T[K]> & Nullable<T[K]>
          } & {length: T["length"]}
          minItems: T["length"]
        } & ({maxItems: T["length"]} | {additionalItems: false})
      : T extends readonly any[]
      ? {
          type: JSONType<"array", _partial>
          items: JSONSchemaType<T[0]>
          contains?: PartialSchema<T[0]>
          minItems?: number
          maxItems?: number
          minContains?: number
          maxContains?: number
          uniqueItems?: true
          additionalItems?: never
        }
      : T extends Record<string, any>
      ? {
          // JSON AnySchema for records and dictionaries
          // "required" is not optional because it is often forgotten
          // "properties" are optional for more concise dictionary schemas
          // "patternProperties" and can be only used with interfaces that have string index
          type: JSONType<"object", _partial>
          additionalProperties?: boolean | JSONSchemaType<T[string]>
          unevaluatedProperties?: boolean | JSONSchemaType<T[string]>
          properties?: _partial extends true ? Partial<PropertiesSchema<T>> : PropertiesSchema<T>
          patternProperties?: {[Pattern in string]?: JSONSchemaType<T[string]>}
          propertyNames?: Omit<JSONSchemaType<string>, "type"> & {type?: "string"}
          dependencies?: {[K in keyof T]?: Readonly<(keyof T)[]> | PartialSchema<T>}
          dependentRequired?: {[K in keyof T]?: Readonly<(keyof T)[]>}
          dependentSchemas?: {[K in keyof T]?: PartialSchema<T>}
          minProperties?: number
          maxProperties?: number
        } & (// "required" type does not guarantee that all required properties
        // are listed it only asserts that optional cannot be listed.
        // "required" is not necessary if it's a non-partial type with no required keys
        _partial extends true
          ? {required: Readonly<(keyof T)[]>}
          : [RequiredMembers<T>] extends [never]
          ? {required?: Readonly<RequiredMembers<T>[]>}
          : {required: Readonly<RequiredMembers<T>[]>})
      : T extends null
      ? {
          nullable: true
        }
      : never) & {
      allOf?: Readonly<PartialSchema<T>[]>
      anyOf?: Readonly<PartialSchema<T>[]>
      oneOf?: Readonly<PartialSchema<T>[]>
      if?: PartialSchema<T>
      then?: PartialSchema<T>
      else?: PartialSchema<T>
      not?: PartialSchema<T>
    })
) & {
  [keyword: string]: any
  $id?: string
  $ref?: string
  $defs?: {
    [Key in string]?: JSONSchemaType<Known, true>
  }
  definitions?: {
    [Key in string]?: JSONSchemaType<Known, true>
  }
}

type Known = KnownRecord | [Known, ...Known[]] | Known[] | number | string | boolean | null

interface KnownRecord extends Record<string, Known> {}

export type PropertiesSchema<T> = {
  [K in keyof T]-?: (JSONSchemaType<T[K]> & Nullable<T[K]>) | {$ref: string}
}

export type RequiredMembers<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type Nullable<T> = undefined extends T
  ? {
      nullable: true
      const?: never // any non-null value would fail `const: null`, `null` would fail any other value in const
      enum?: Readonly<(T | null)[]> // `null` must be explicitly included in "enum" for `null` to pass
      default?: T | null
    }
  : {
      const?: T
      enum?: Readonly<T[]>
      default?: T
    }
