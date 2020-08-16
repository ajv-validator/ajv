export default class SchemaObject {
  schema?: any
  validate?: () => any

  constructor(obj: object) {
    Object.assign(this, obj)
  }
}
