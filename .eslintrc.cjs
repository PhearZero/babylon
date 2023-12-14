module.exports = {
  root: true,
  parserOptions: {
    sourceType: "module",
  },
  env: { es2022: true, node: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
}
