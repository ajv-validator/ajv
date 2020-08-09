module.exports = {
  keywords: ["const"],
  $data: true,
  code: ({fail, data, schemaCode}) => fail(`!equal(${data}, ${schemaCode})`),
  error: {
    message: () => '"should be equal to constant"',
    params: ({schemaCode}) => `{ allowedValue: ${schemaCode} }`,
  },
}
