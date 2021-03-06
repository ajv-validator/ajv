/** required keys of an object, not undefined */
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

/** optional or undifined-able keys of an object */
type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

/** type is true if T is a union type */
type IsUnion_<T, U extends T = T> = false extends (
  T extends unknown ? ([U] extends [T] ? false : true) : never
)
  ? false
  : true
type IsUnion<T> = IsUnion_<T>

/** type is true if T is identically E */
type TypeEquality<T, E> = [T] extends [E] ? ([E] extends [T] ? true : false) : false

/** gets only the string literals of a type or null if a type isn't a string literal */
type EnumString<T> = [T] extends [never]
  ? null
  : T extends string
  ? string extends T
    ? null
    : T
  : null

/** true only if all types are array types (not tuples) */
// NOTE relies on the fact that tuples don't have an index at 0.5, but arrays
// have an index at every number
type IsElements<T> = [T] extends [readonly unknown[]]
  ? undefined extends T[0.5]
    ? false
    : true
  : false

/** numeric strings */
type NumberType = "float32" | "float64" | "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32"

/** string strings */
type StringType = "string" | "timestamp"

/** actual schema */
export type JTDSchemaType<T, D extends Record<string, unknown> = Record<string, never>> = (
  | // refs - where null wasn't specified, must match exactly
  (null extends EnumString<keyof D>
      ? never
      : {[K in keyof D]: [T] extends [D[K]] ? {ref: K} : never}[keyof D] & {nullable?: false})
  // nulled refs - if ref is nullable and nullable is specified, then it can
  // match either null or non-null definitions
  | (null extends EnumString<keyof D>
      ? never
      : null extends T
      ? {
          [K in keyof D]: [Exclude<T, null>] extends [Exclude<D[K], null>] ? {ref: K} : never
        }[keyof D] & {nullable: true}
      : never)
  // empty - empty schemas also treat nullable differently in that it's now fully ignored
  | (unknown extends T ? {nullable?: boolean} : never)
  // all other types
  | ((
      | // numbers - only accepts the type number
      (true extends TypeEquality<Exclude<T, null>, number> ? {type: NumberType} : never)
      // booleans - accepts the type boolean
      | (true extends TypeEquality<Exclude<T, null>, boolean> ? {type: "boolean"} : never)
      // strings - only accepts the type string
      | (true extends TypeEquality<Exclude<T, null>, string> ? {type: StringType} : never)
      // strings - only accepts the type Date
      | (true extends TypeEquality<Exclude<T, null>, Date> ? {type: "timestamp"} : never)
      // enums - only accepts union of string literals
      // TODO we can't actually check that everything in the union was specified
      | (null extends EnumString<Exclude<T, null>> ? never : {enum: EnumString<Exclude<T, null>>[]})
      // arrays - only accepts arrays, could be array of unions to be resolved later
      | (false extends IsUnion<Exclude<T, null>>
          ? true extends IsElements<Exclude<T, null>>
            ? T extends readonly (infer E)[]
              ? {
                  elements: JTDSchemaType<E, D>
                }
              : never
            : never
          : never)
      // values
      | (false extends IsUnion<Exclude<T, null>>
          ? true extends TypeEquality<keyof Exclude<T, null>, string>
            ? T extends Record<string, infer V>
              ? {
                  values: JTDSchemaType<V>
                }
              : never
            : never
          : never)
      // properties
      | (false extends IsUnion<Exclude<T, null>>
          ? null extends EnumString<keyof Exclude<T, null>>
            ? never
            : ([RequiredKeys<Exclude<T, null>>] extends [never]
                ? {
                    properties?: Record<string, never>
                  }
                : {
                    properties: {[K in RequiredKeys<T>]: JTDSchemaType<T[K], D>}
                  }) &
                ([OptionalKeys<Exclude<T, null>>] extends [never]
                  ? {
                      optionalProperties?: Record<string, never>
                    }
                  : {
                      optionalProperties: {
                        [K in OptionalKeys<T>]: JTDSchemaType<Exclude<T[K], undefined>, D>
                      }
                    }) & {
                  additionalProperties?: boolean
                }
          : never)
      // discriminator
      | (true extends IsUnion<Exclude<T, null>>
          ? null extends EnumString<keyof Exclude<T, null>>
            ? never
            : {
                [K in keyof Exclude<T, null>]-?: Exclude<T, null>[K] extends string
                  ? {
                      discriminator: K
                      mapping: {
                        // TODO currently allows descriminator to be present in schema
                        [M in Exclude<T, null>[K]]: JTDSchemaType<
                          Omit<T extends {[C in K]: M} ? T : never, K>,
                          D
                        >
                      }
                    }
                  : never
              }[keyof Exclude<T, null>]
          : never)
    ) &
      (null extends T
        ? {
            nullable: true
          }
        : {nullable?: false}))
) & {
  // extra properties
  metadata?: Record<string, unknown>
  // TODO these should only be allowed at the top level
  definitions?: {[K in keyof D]: JTDSchemaType<D[K], D>}
}

type JTDDataDef<S, D extends Record<string, unknown>> =
  | (// ref
    S extends {ref: string}
      ? JTDDataDef<D[S["ref"]], D>
      : // type
      S extends {type: NumberType}
      ? number
      : S extends {type: "string"}
      ? string
      : S extends {type: "timestamp"}
      ? string | Date
      : // enum
      S extends {enum: readonly (infer E)[]}
      ? string extends E
        ? never
        : [E] extends [string]
        ? E
        : never
      : // elements
      S extends {elements: infer E}
      ? JTDDataDef<E, D>[]
      : // properties
      S extends {
          properties: Record<string, unknown>
          optionalProperties?: Record<string, unknown>
          additionalProperties?: boolean
        }
      ? {-readonly [K in keyof S["properties"]]-?: JTDDataDef<S["properties"][K], D>} &
          {
            -readonly [K in keyof S["optionalProperties"]]+?: JTDDataDef<
              S["optionalProperties"][K],
              D
            >
          } &
          ([S["additionalProperties"]] extends [true] ? Record<string, unknown> : unknown)
      : S extends {
          properties?: Record<string, unknown>
          optionalProperties: Record<string, unknown>
          additionalProperties?: boolean
        }
      ? {-readonly [K in keyof S["properties"]]-?: JTDDataDef<S["properties"][K], D>} &
          {
            -readonly [K in keyof S["optionalProperties"]]+?: JTDDataDef<
              S["optionalProperties"][K],
              D
            >
          } &
          ([S["additionalProperties"]] extends [true] ? Record<string, unknown> : unknown)
      : // values
      S extends {values: infer V}
      ? Record<string, JTDDataDef<V, D>>
      : // discriminator
      S extends {discriminator: infer M; mapping: Record<string, unknown>}
      ? [M] extends [string]
        ? {
            [K in keyof S["mapping"]]: JTDDataDef<S["mapping"][K], D> & {[KM in M]: K}
          }[keyof S["mapping"]]
        : never
      : // empty
        unknown)
  | (S extends {nullable: true} ? null : never)

export type JTDDataType<S> = S extends {definitions: Record<string, unknown>}
  ? JTDDataDef<S, S["definitions"]>
  : JTDDataDef<S, Record<string, never>>
