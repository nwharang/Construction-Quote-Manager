/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  semi: true,
  trailingComma: "es5",
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100
};
