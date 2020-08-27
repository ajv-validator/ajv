import {Name} from "./codegen"

const names = {
  validate: new Name("validate"), // validation function name
  // validation function arguments
  data: new Name("data"), // data passed to validation function
  // args passed from referencing schema
  dataPath: new Name("dataPath"),
  parentData: new Name("parentData"),
  parentDataProperty: new Name("parentDataProperty"),
  rootData: new Name("rootData"), // data passed to the first/top validation function
  // function scoped variables
  vErrors: new Name("vErrors"), // null or array of validation errors
  errors: new Name("errors"), // counter of validation errors
  this: new Name("this"),
  // "globals"
  self: new Name("self"),
}

export default names
