const objectProtoProps = new Set(Object.getOwnPropertyNames(Object.prototype))

// Properties of Object.prototype ("toString", "constructor", "__proto__", ...) are inherited
// by most objects and are not enumerable, so `data[prop] !== undefined` is not sufficient
// to determine whether the data has such a property.
// Only these property names are checked - a property with any other name is present
// if it is not undefined, as before.
export function isObjectProtoProperty(prop: string): boolean {
  return objectProtoProps.has(prop)
}

export default function hasProperty(data: object, prop: string): boolean {
  if (!objectProtoProps.has(prop)) return true
  if (Object.prototype.hasOwnProperty.call(data, prop)) return true
  let proto = Object.getPrototypeOf(data)
  while (proto !== null) {
    if (Object.prototype.hasOwnProperty.call(proto, prop)) {
      return Object.prototype.propertyIsEnumerable.call(proto, prop)
    }
    proto = Object.getPrototypeOf(proto)
  }
  return false
}

hasProperty.code = 'require("ajv/dist/runtime/hasProperty").default'
