const {slugify} = require("@vuepress/shared-utils")

module.exports = {
  title: "Ajv: Another JSON validator",
  description: "Just playing around",
  markdown: {
    slugify: (str) => slugify(str.replace(/<Badge[^>]*\/>/, "")),
    toc: {includeLevel: [2, 3, 4]},
  },
  themeConfig: {
    logo: "/ajv.svg",
    nav: [
      {text: "Home", link: "/"},
      {
        text: "Validation",
        items: [
          {text: "Validating data", link: "/validation"},
          {text: "Strict mode", link: "/strict-mode"},
          {text: "JSON Schema", link: "/json-schema"},
          {text: "JSON Type Definition", link: "/json-type-definition"},
          {text: "Type coercion", link: "/coercion"},
        ],
      },
      {
        text: "API",
        items: [
          {text: "Methods & options", link: "/api"},
          {text: "Define keywords", link: "/keywords"},
        ],
      },
      {text: "Security", link: "/security"},
      {text: "FAQ", link: "/faq"},
    ],
    sidebar: [
      "/",
      {
        title: "Guide",
        collapsable: false,
        children: [
          "/guide/getting-started",
          "/guide/typescript",
          "/guide/schema-language",
          "/guide/managing-schemas",
          "/guide/modular-schemas",
          "/guide/environments",
        ]
      },
      {
        title: "Reference",
        collapsable: false,
        children: [
          "/validation",
          "/api",
          "/json-schema",
          "/json-type-definition",
          "/strict-mode",
          "/keywords",
          "/coercion",
        ],
      },
      {
        title: "Code generation & design",
        collapsable: false,
        children: ["/standalone", "/codegen", "/components"],
      },
      {
        title: "Information",
        collapsable: false,
        children: [
          "/faq",
          "/security",
          "/CONTRIBUTING",
          ["/CODE_OF_CONDUCT", "Code of conduct"],
          ["/LICENSE", "License"]
        ],
      },
    ],
    repo: "ajv-validator/ajv",
    docsDir: "docs",
    editLinks: true,
  },
}
