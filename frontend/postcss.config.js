// ESM PostCSS config: project is ESM (package.json `type: "module"`).
// Export as default to avoid `module is not defined` when node treats
// this file as an ES module.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
