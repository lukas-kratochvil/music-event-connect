import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactHooksAddons from "eslint-plugin-react-hooks-addons";
import globals from "globals";
import createFromTsConfig from "./base-ts.mjs";

export default createFromTsConfig(
  jsxA11y.flatConfigs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended"],
  reactHooksAddons.configs.recommended,
  // Global React settings & hook rules (applies to all files)
  {
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks-addons/no-unused-deps": "warn",
    },
  },
  // React-specific rules (targeting only files with markup (.jsx, .tsx))
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      "react/function-component-definition": [2, { namedComponents: "arrow-function" }],
      "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
      "react/jsx-first-prop-new-line": [1, "multiline"],
      "react/jsx-max-props-per-line": [1, { maximum: { single: 3, multi: 1 } }],
      "react/jsx-no-duplicate-props": [1, { ignoreCase: false }],
      "react/jsx-props-no-spreading": "off",
      "react/no-array-index-key": "warn",
      "react/require-default-props": "off",
    },
  },
  // TypeScript language options (targeting only TypeScript files)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "tsconfig.eslint.json",
      },
      globals: {
        ...globals.browser,
      },
    },
  }
);
