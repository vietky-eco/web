
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      ".lighthouseci/**",
      "lhci-report/**"
    ]
  },
  {
    files: ["js/**/*.js"],
    ...js.configs.recommended,

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },

    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  }
];
