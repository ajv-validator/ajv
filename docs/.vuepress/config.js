const {slugify} = require("@vuepress/shared-utils")

module.exports = {
  title: "Ajv: Another JSON validator",
  description: "Just playing around",
  markdown: {
    slugify: (str) => slugify(str.replace(/<Badge[^>]*\/>/, "")),
    toc: {includeLevel: [2, 3, 4]}
  },
  themeConfig: {
    logo: "https://ajv.js.org/images/ajv_logo.png",
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
      "/faq",
      "/security",
      {
        title: "Validation",
        collapsable: false,
        children: [
          "/validation",
          "/strict-mode",
          "/json-schema",
          "/json-type-definition",
          "/api",
          "/keywords",
          "/coercion",
        ],
      },
      {
        title: "Code generation & design",
        collapsable: false,
        children: ["/standalone", "/codegen", "/components"],
      },
    ],
    nextLinks: false,
    prevLinks: false,
    repo: "ajv-validator/ajv",
    docsDir: "docs",
    editLinks: true,
  },
}
