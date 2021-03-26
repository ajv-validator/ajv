const {slugify} = require("@vuepress/shared-utils")

module.exports = {
  title: "Ajv: Another JSON validator",
  description: "Just playing around",
  markdown: {
    slugify: (str) => slugify(str.replace(/<Badge[^>]*\/>/, "")),
    toc: {includeLevel: [2, 3, 4]},
  },
  themeConfig: {
    logo: "/img/ajv.svg",
    nav: [
      {text: "Home", link: "/"},
      {
        text: "Guide",
        items: [
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
        text: "Learn more",
        items: [
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
              {link: "/security", text: "Security"},
              {link: "/faq", text: "FAQ"},
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
        children: ["/faq", "/security", ["/license", "License"]],
      },
    ],
    repo: "ajv-validator/ajv",
    docsDir: "docs",
    editLinks: true,
  },
}
