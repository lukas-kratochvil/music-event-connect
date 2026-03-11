import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactHooksAddons from "eslint-plugin-react-hooks-addons";
import globals from "globals";
import createFromTsConfig from "./base-ts.mjs";
import { FILE_MATCHERS } from "./constants.js";

export default createFromTsConfig(
  // ==========================================
  // GLOBAL (applies to ALL files)
  // ==========================================
  {
    settings: {
      react: { version: "detect" },
    },
  },

  // ==========================================
  // TYPESCRIPT (applies only to .ts, .tsx)
  // ==========================================
  // using [].concat() safely handles both arrays and single objects exported by plugins
  ...[]
    .concat(
      jsxA11y.flatConfigs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      reactHooksAddons.configs.recommended
    )
    .flat()
    .map((config) => ({
      ...config,
      files: FILE_MATCHERS.ts,
    })),
  {
    files: FILE_MATCHERS.ts,
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ["tsconfig.app.json", "tsconfig.node.json"],
      },
      globals: { ...globals.browser },
    },
    rules: {
      "react/function-component-definition": [2, { namedComponents: "arrow-function" }],
      "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
      "react/jsx-first-prop-new-line": [1, "multiline"],
      "react/jsx-max-props-per-line": [1, { maximum: { single: 3, multi: 1 } }],
      "react/jsx-no-duplicate-props": [1, { ignoreCase: false }],
      "react/jsx-props-no-spreading": "off",
      "react/no-array-index-key": "warn",
      "react/require-default-props": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks-addons/no-unused-deps": "warn",
    },
  }
);
