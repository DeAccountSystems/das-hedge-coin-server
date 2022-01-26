module.exports = {
  extends: [
    'blockabc/typescript'
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'no-useless-constructor': [0],
  }
}
