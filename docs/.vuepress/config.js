const {slugify} = require("@vuepress/shared-utils")

const title = "Ajv JSON schema validator"
const description =
  "The fastest JSON schema Validator. Supports JSON Schema draft-04/06/07/2019-09/2020-12 and JSON Type Definition (RFC8927)"

module.exports = {
  title,
  description,
  head: [
    ["link", {rel: "icon", href: `/favicon.ico`}],
    ["meta", {charset: "utf-8"}],
    ["meta", {property: "og:title", content: title}],
    ["meta", {property: "og:description", content: description}],
    ["meta", {property: "og:image", content: "https://ajv.js.org/img/ajv.png"}],
    ["meta", {itemprop: "image", content: "https://ajv.js.org/img/ajv.png"}],
    ["meta", {name: "twitter:card", content: "summary"}],
    ["meta", {name: "twitter:title", content: title}],
    ["meta", {name: "twitter:image:src", content: "https://ajv.js.org/img/ajv.png"}],
    ["meta", {name: "apple-mobile-web-app-capable", content: "yes"}],
    ["link", {rel: "apple-touch-icon", href: `/img/apple-touch-icon.png`}],
  ],
  markdown: {
    slugify: (str) => slugify(str.replace(/<Badge[^>]*\/>/, "")),
    toc: {includeLevel: [2, 3, 4]},
  },
  heroText: "hello there",
  themeConfig: {
    logo: "/img/ajv.svg",
    nav: [
      {text: "Home", link: "/"},
      {
        text: "Guide",
        items: [
          {link: "/guide/why-ajv", text: "Why use Ajv"},
          {link: "/guide/getting-started", text: "Getting started"},
          {link: "/guide/typescript", text: "Using with TypeScript"},
          {link: "/guide/schema-language", text: "Choosing schema language"},
          {link: "/guide/managing-schemas", text: "Managing schemas"},
          {link: "/guide/combining-schemas", text: "Combining schemas"},
          {link: "/guide/formats", text: "Format validation"},
          {link: "/guide/modifying-data", text: "Modifying data"},
          {link: "/guide/user-keywords", text: "User-defined keywords"},
          {link: "/guide/async-validation", text: "Asynchronous validation"},
          {link: "/guide/environments", text: "Execution environments"},
        ],
      },
      {
        text: "Reference",
        items: [
          {link: "/api", text: "API Reference"},
          {link: "/options", text: "Ajv options"},
          {link: "/json-schema", text: "JSON Schema"},
          {link: "/json-type-definition", text: "JSON Type Definition"},
          {link: "/strict-mode", text: "Strict mode"},
          {link: "/standalone", text: "Standalone validation code"},
          {link: "/keywords", text: "User defined keywords"},
          {link: "/coercion", text: "Type coercion rules"},
        ],
      },
      {
        text: "Learn more",
        items: [
          {
            text: "Extending Ajv",
            items: [
              {link: "/packages/", text: "Extending Ajv"},
              {link: "/packages/ajv-cli", text: "ajv-cli"},
              {link: "/packages/ajv-errors", text: "ajv-errors"},
              {link: "/packages/ajv-formats", text: "ajv-formats"},
              {link: "/packages/ajv-i18n", text: "ajv-i18n"},
              {link: "/packages/ajv-keywords", text: "ajv-keywords"},
            ],
          },
          {
            text: "Contributors",
            items: [
              {link: "/contributing", text: "Contributing guide"},
              {link: "/codegen", text: "Code generation design"},
              {link: "/components", text: "Code components"},
              {link: "/code_of_conduct", text: "Code of Conduct"},
            ],
          },
          {
            text: "Information",
            items: [
              {link: "/news/", text: "News"},
              {link: "/faq", text: "FAQ"},
              {link: "/security", text: "Security"},
              {link: "/v6-to-v8-migration", text: "Migrate from v6"},
              {link: "/testimonials", text: "What users say"},
              {link: "/license", text: "License"},
            ],
          },
        ],
      },
    ],
    sidebar: [
      {
        title: "Guide",
        children: [
          "/guide/why-ajv",
          "/guide/getting-started",
          "/guide/typescript",
          "/guide/schema-language",
          "/guide/managing-schemas",
          "/guide/combining-schemas",
          "/guide/formats",
          "/guide/modifying-data",
          "/guide/user-keywords",
          "/guide/async-validation",
          "/guide/environments",
        ],
      },
      {
        title: "Reference",
        children: [
          "/api",
          "/options",
          "/json-schema",
          "/json-type-definition",
          "/strict-mode",
          "/standalone",
          "/keywords",
          "/coercion",
        ],
      },
      {
        title: "Extending Ajv",
        children: [
          ["/packages/", "Extending Ajv"],
          ["/packages/ajv-formats", "ajv-formats"],
          ["/packages/ajv-keywords", "ajv-keywords"],
          ["/packages/ajv-errors", "ajv-errors"],
          ["/packages/ajv-i18n", "ajv-i18n"],
          ["/packages/ajv-cli", "ajv-cli"],
        ],
      },
      {
        title: "Contributors",
        children: [
          "/contributing",
          "/codegen",
          "/components",
          ["/code_of_conduct", "Code of conduct"],
        ],
      },
      {
        title: "Information",
        children: [
          "/news/",
          "/faq",
          "/security",
          ["/v6-to-v8-migration", "Migrate from v6 to v8"],
          "/testimonials",
          ["/license", "License"],
        ],
      },
    ],
    repo: "ajv-validator/ajv",
    docsDir: "docs",
    editLinks: true,
    activeHeaderLinks: false,
  },
}
