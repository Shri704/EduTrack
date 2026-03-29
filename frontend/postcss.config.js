// PostCSS config must be CommonJS so tooling like Vite/PostCSS
// can load it without ESM warnings.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};


