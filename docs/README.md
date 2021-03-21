---
homepage: true
editLink: true
---

<HeroSection>

# Ajv JSON Validator

## Security and reliability of JavaScript applications

<Features>

<Feature type="less-code" link="/api.html">

### Write less code

Ensure your data is valid once it is received

</Feature>

<Feature type="fast-secure" link="/api.html">

### Super fast & secure

Compiles your schemas to optimized JavaScript code

</Feature>

<Feature type="multi-spec" link="/api.html">

### Multi-standard

Use JSON Type Definition or JSON Schema

</Feature>

</Features>

<Sponsors>

Platinum sponsors

[![mozilla](/img/mozilla.svg)](https://www.mozilla.org)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)

</Sponsors>

</HeroSection>

<HomeSection>

<Columns>
<Column side="left">

You can use Ajv with schema instead of writing validation code.

</Column>

<Column side="right">

<code-group>
<code-block title="JSON Schema">
```javascript
const Ajv = require("ajv").default
const ajv = new Ajv()

const schema = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string"}
  },
  required: ["foo"],
  additionalProperties: false
}

const valid = ajv.validate(schema, {foo: 1, bar: "abc"})
if (!valid) console.log(validate.errors)
```
</code-block>

<code-block title="JSON Type Definition">
```javascript
const Ajv = require("ajv/dist/jtd").default
const ajv = new Ajv()

const schema = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}


const valid = ajv.validate(schema, {foo: 1, bar: "abc"})
if (!valid) console.log(validate.errors)
```
</code-block>
</code-group>
</Column>
</Columns>
</HomeSection>

<HomeSection>

## News

<HomeNewsSection/>

</HomeSection>

<HomeSection>

Ajv is a widely used library that provides reliability, safety and security to millions of JavaScript applications and other libraries. It can be used in all JavaScript environments - node.js, browsers, Electron apps, etc. If your environment or security policy prohibit run-time function construction you can compile your schemas during build time into a standalone validation code (it may still have dependencies on small parts of Ajv code, but doesn't use the whole library) - since version 7 it is fully supported for all JSON schemas.

Installation

Usage example / or small playground

Try in the playground (TBC)

</HomeSection>

<HomeSection>

## Who uses Ajv

<Projects>
[![eslint](./projects/eslint.png)](https://eslint.org)
[![stoplight](./projects/stoplight.png)](https://stoplight.io)
[![webpack](./projects/webpack.svg)](https://webpack.js.org)
[table](https://github.com/gajus/table)
[![fastify](./projects/fastify.png)](https://www.fastify.io)
[restbase](https://github.com/wikimedia/restbase)
[objection.js](https://github.com/vincit/objection.js)
[![Taskcluster](./projects/taskcluster.png)](https://taskcluster.net)
[![RxDB](./projects/rxdb.svg)](https://rxdb.info)
[![react-jsonschema-form](./projects/rjsf.png)](https://github.com/rjsf-team/react-jsonschema-form)
[![autorest](./projects/autorest.png)](https://github.com/Azure/autorest)
[![node-red](./projects/nodered.png)](https://github.com/node-red/node-red)
[![MDN](./projects/mdn.svg)](https://developer.mozilla.org)
[![quicktype](./projects/quicktype.svg)](https://github.com/quicktype/quicktype)
[![vue-form-generator](./projects/vue-form-generator.png)](https://github.com/vue-generators/vue-form-generator)
[![teambit](./projects/teambit.png)](https://github.com/teambit/bit)
[React Page](https://react-page.github.io)
[![Backstage](./projects/backstage.svg)](https://backstage.io)
[![rushstack](./projects/rushstack.svg)](https://github.com/microsoft/rushstack)
[JupyterLab](https://github.com/jupyterlab/jupyterlab)
[![0x](./projects/0x.png)](https://github.com/davidmarkclements/0x)
[Plank.js](https://piqnt.com/planck.js/)
[![fast](./projects/fast.svg)](https://www.fast.design)
[![netlify cms](./projects/netlify-cms.png)](https://www.netlifycms.org)
[![ng-alain](./projects/ng-alain.svg)](https://ng-alain.com/en)
[![Vercel](./projects/vercel.svg)](https://vercel.com)
[![AWS Amplify](./projects/aws-amplify.png)](https://github.com/aws-amplify/amplify-cli)
[![FB flipper](./projects/flipper.png)](https://github.com/facebook/flipper)
[![nx.dev](./projects/nx.svg)](https://nx.dev)
[![express gateway](./projects/express-gateway.svg)](https://www.express-gateway.io)
[![zigbee2mqtt](./projects/zigbee2mqtt.png)](https://www.zigbee2mqtt.io)
[![dependency-cruiser](./projects/dependency-cruiser.png)](https://github.com/sverweij/dependency-cruiser)
[![theia](./projects/theia.svg)](https://theia-ide.org)
[![TSDoc](./projects/tsdoc.svg)](https://tsdoc.org)
[![webhint](./projects/webhint.jpg)](https://webhint.io)
[Vega-Lite](https://vega.github.io/vega-lite/)
[![middy](./projects/middy.png)](https://middy.js.org)
[JSDoc](https://github.com/jsdoc/jsdoc)

</Projects>
</HomeSection>

<HomeSection section="contributors">

## Contributors

Ajv is free to use and open-source that many developers contributed to. Join us!

<Contributors />

</HomeSection>
