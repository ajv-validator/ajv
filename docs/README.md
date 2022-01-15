---
homepage: true
sidebar: false
---

<HeroSection>

# Ajv JSON schema validator

## Security and reliability for JavaScript applications

<Features>
<Feature type="less-code" link="/guide/why-ajv.html#write-less-code">

### Write less code

Ensure your data is valid once it is received

</Feature>
<Feature type="fast-secure" link="/guide/why-ajv.html#super-fast-secure">

### Super fast & secure

Compiles your schemas to optimized JavaScript code

</Feature>

<Feature type="multi-spec" link="/guide/why-ajv.html#multi-standard">

### Multi-standard

Use JSON Type Definition or JSON Schema

</Feature>
</Features>

<Sponsors level="platinum">

## Ajv sponsors

[![mozilla](/img/mozilla.svg)](https://www.mozilla.org)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)

</Sponsors>

<Sponsors level="gold">

[![microsoft](/img/microsoft.png)](https://opensource.microsoft.com)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)

</Sponsors>

<Sponsors level="bronze">

[![Retool](/img/retool.svg)](https://retool.com/?utm_source=sponsor&utm_campaign=ajv)
[![Tidelift](/img/tidelift.svg)](https://tidelift.com/subscription/pkg/npm-ajv?utm_source=npm-ajv&utm_medium=referral&utm_campaign=enterprise)
[![SimpleX](/img/simplex.svg)](https://github.com/simplex-chat/simplex-chat)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)

</Sponsors>

</HeroSection>

<HomeSection>
<Columns>
<Column side="left">

Ajv is used by a large number of JavaScript applications and libraries in all JavaScript environments - Node.js, browser, Electron apps, WeChat mini-apps etc.

It allows implementing complex data validation logic via declarative schemas for your JSON data, without writing code.

Out of the box, Ajv supports [JSON Schema](./json-schema.md) (drafts 04, 06, 07, 2019-09 and 2020-12) and [JSON Type Definition](./json-type-definition.md) ([RFC8927](https://datatracker.ietf.org/doc/rfc8927/)).

<br/>

<Button link="/guide/getting-started.html">Learn Ajv</Button>

<br/>

</Column>

<Column side="right">
<code-group>
<code-block title="JSON Schema">
```javascript
const Ajv = require("ajv")
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

const data = {foo: 1, bar: "abc"}
const valid = ajv.validate(schema, data)
if (!valid) console.log(ajv.errors)
```
</code-block>

<code-block title="JSON Type Definition">
```javascript
const Ajv = require("ajv/dist/jtd")
const ajv = new Ajv()

const schema = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}


const data = {foo: 1, bar: "abc"}
const valid = ajv.validate(schema, data)
if (!valid) console.log(ajv.errors)
```
</code-block>
</code-group>
</Column>
</Columns>
</HomeSection>

<HomeSection section="testimonials">

## What users say

<Testimonials>
<Testimonial color="green">

Ajv stands out as the implementation of choice - it provides a rich API which many thousands of people use in production... Ajv is partly responsible for the success of JSON Schema.

[Ben Hutton](https://github.com/relequestual), JSON Schema Specification Lead

</Testimonial>

<Testimonial color="blue">

[ESLint](https://eslint.org/) has used Ajv for validating our complex configurations. Ajv has proven to be reliable over the years we’ve been using it and ESLint is proud to sponsor Ajv’s continued development.

[Nicholas C. Zakas](https://github.com/nzakas), ESLint creator and TSC member

</Testimonial>
</Testimonials>

<span style="float:right;">[All quotes](./testimonials.md)</span>

</HomeSection>

<HomeSection>

## News

<NewsHome/>

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
[![Ts.ED](./projects/tsed.png)](https://tsed.io)

</Projects>
</HomeSection>

<HomeSection section="contributors">

## Contributors

Ajv is free to use and open-source that many developers contributed to. Join us!

<Contributors />

</HomeSection>

<HomeSection section="footer">

<FooterColumns>
<FooterColumn type="ajv">
![ajv](/img/ajv.svg)

</FooterColumn>

<FooterColumn type="links">

[Learn Ajv](./guide/getting-started.md)

[Reference](./api.md)

[Security](./security.md)

</FooterColumn>

<FooterColumn type="links">

[JSON Schema](./json-schema.md)

[JSON Type Definition](./json-type-definition.md)

[Contributing](./contributing.md)

</FooterColumn>

<FooterColumn type="sponsors">

[![mozilla](/img/mozilla.svg)](https://www.mozilla.org)
[![reserved](/img/reserved.svg)](https://opencollective.com/ajv)

</FooterColumn>
</FooterColumns>

[&copy; 2015-2021](./license.md) | Ajv JSON schema validator | [ajv.validator@gmail.com](mailto:ajv.validator@gmail.com)

</HomeSection>
