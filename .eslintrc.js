const jsConfig = require("@ajv-validator/config/.eslintrc_js")
const tsConfig = require("@ajv-validator/config/.eslintrc")

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  overrides: [
    jsConfig,
    {
      ...tsConfig,
      files: ["*.ts"],
      rules: {
        ...tsConfig.rules,
        complexity: ["error", 17],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-implied-eval": "off",
        "@typescript-eslint/no-invalid-this": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
      },
    },
  ],
}
