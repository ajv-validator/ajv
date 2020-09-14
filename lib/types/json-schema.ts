export type JSONSchemaType<T> = (T extends number
  ? {
      type: "number" | "integer"
      minimum?: number
      maximum?: number
      exclusiveMinimum?: number
      exclusiveMaximum?: number
      multipleOf?: number
      format?: string
    }
  : T extends string
  ? {
      type: "string"
      minLength?: number
      maxLength?: number
      pattern?: string
      format?: string
    }
  : T extends boolean
  ? {
      type: "boolean"
    }
  : T extends [any, ...any[]]
  ? {
      type: "array"
      items: {
        [K in keyof T]-?: JSONSchemaType<T[K]> & Nullable<T[K]>
      } & {length: T["length"]}
      minItems: T["length"]
    } & ({maxItems: T["length"]} | {additionalItems: false})
  : T extends any[]
  ? {
      type: "array"
      items: JSONSchemaType<T[0]>
      minItems?: number
      maxItems?: number
      uniqueItems?: true
      additionalItems?: never
    }
  : T extends Record<string, any>
  ? {
      type: "object"
      // "required" type does not guarantee that all required properties are listed
      // it only asserts that optional cannot be listed
      required: RequiredMembers<T>[]
      additionalProperties: boolean | JSONSchemaType<T[string]>
      properties?: {
        [K in keyof T]-?: JSONSchemaType<T[K]> & Nullable<T[K]>
      }
      patternProperties?: {
        [pattern: string]: JSONSchemaType<T[string]>
      }
      propertyNames?: JSONSchemaType<string>
      minProperties?: number
      maxProperties?: number
    }
  : never) & {
  [keyword: string]: any
}

type RequiredMembers<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type Nullable<T> = undefined extends T
  ? {
      nullable: true
      const?: null // any other value here would make `null` fail
      enum?: (T | null)[] // `null` must be explicitely included in "enum"
      default?: T | null
    }
  : {
      const?: T
      enum?: T[]
      default?: T
    }
