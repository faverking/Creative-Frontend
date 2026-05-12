module.exports = {
  root: true,
  extends: [
    require.resolve('./base'),
    require.resolve('./ts'),
    require.resolve('./vue')
  ],
  ignorePatterns: ['**/dist/**', '**/coverage/**', '**/node_modules/**']
}
