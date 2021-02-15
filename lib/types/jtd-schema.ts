/** required keys of an object, not undefined */
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

/** optional or undifined-able keys of an object */
type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

/** type is true if all elements of T extend T */
type AllExtend_<T, E> = T extends E ? true : false
type AllExtend<T, E> = false extends AllExtend_<T, E> ? false : true

/** type is true if type is identically string */
type IsString_<T> = T extends string ? (string extends T ? true : false) : false
type IsString<T> = false extends IsString_<T> ? false : true

/** gets only the string literals of a type or null if a type isn't a string literal */
type NullableStringLiterals<T> = T extends string ? (string extends T ? null : T) : null

/** numeric strings */
type NumberType = "float32" | "float64" | "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32"

/** string strings */
type StringType = "string" | "timestamp"

/** actual schema */
export type JTDSchema<T, D extends Record<string, unknown> = Record<string, never>> = (
  | // refs - accepts any key in definitions of the right type
  {[K in keyof D]: T extends D[K] ? {ref: K} : never}[keyof D]
  // numbers - only accepts number or union of number literals
  | (AllExtend<T, number | null> extends true ? {type: NumberType} : never)
  // booleans - accepts any boolean, incluting just true or false literals
  | (AllExtend<T, boolean | null> extends true ? {type: "boolean"} : never)
  // strings - only accepts the type string
  // TODO accept Date?
  | (IsString<Exclude<T, null>> extends true ? {type: StringType} : never)
  // enums - only accepts union of string literals
  | (// TODO we can't actually check that everything in the union was specified
    null extends NullableStringLiterals<Exclude<T, null>>
      ? never
      : {enum: NullableStringLiterals<Exclude<T, null>>[]})
  // arrays - only accepts arrays, could be array of unions to be resolved later
  | (T extends (infer E)[]
      ? {
          elements: JTDSchema<E, D>
        }
      : never)
  // all object like
  | (keyof T extends string
      ?
          | // values
          {
              values: JTDSchema<T[keyof T], D>
            }
          // explicit keys
          | ((RequiredKeys<Exclude<T, null>> extends never
              ? {
                  properties?: Record<string, never>
                }
              : {
                  properties: {[K in RequiredKeys<T>]: JTDSchema<T[K], D>}
                }) &
              (OptionalKeys<Exclude<T, null>> extends never
                ? {
                    optionalProperties?: Record<string, never>
                  }
                : {
                    optionalProperties: {
                      [K in OptionalKeys<T>]: JTDSchema<Exclude<T[K], undefined>, D>
                    }
                  }) & {
                additionalProperties?: boolean
              })
          // tagged unions
          | {
              [K in keyof T]-?: T[K] extends string
                ? {
                    discriminator: K
                    mapping: {
                      // TODO currently allows descriminator to be present in schema
                      [M in T[K]]: JTDSchema<Omit<T extends {[D in K]: M} ? T : never, K>, D>
                    }
                  }
                : never
            }[keyof T]
          // empty
          // TODO as written, and object like could get an empty schema which
          // potentially breaks guarantees, but does match the spec
          | Record<string, never>
      : never)
) & {
  // extra properties
  // TODO handle ajv extensions to metadata?
  metadata?: {[name: string]: unknown}
  // TODO these should only be allowed at the top level, but typescript doesn't like saying no
  definitions?: {[K in keyof D]: JTDSchema<D[K], D>}
} & (null extends T
    ? {
        nullable: true
      }
    : {nullable?: false})
