import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactHooksAddons from "eslint-plugin-react-hooks-addons";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import ts from "typescript-eslint";
import baseTsConfig from "./base-ts.mjs";

export default ts.config(
  ...baseTsConfig,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat["recommended"],
  reactHooksAddons.configs.recommended,
  reactRefresh.configs.vite,
  {
    files: ["**/*.{jsx,tsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/function-component-definition": [
        2,
        {
          namedComponents: "arrow-function",
        },
      ],
      "react/jsx-filename-extension": [
        "warn",
        {
          extensions: [".tsx"],
        },
      ],
      "react/jsx-first-prop-new-line": [1, "multiline"],
      "react/jsx-max-props-per-line": [
        1,
        {
          maximum: {
            single: 3,
            multi: 1,
          },
        },
      ],
      "react/jsx-no-duplicate-props": [
        1,
        {
          ignoreCase: false,
        },
      ],
      "react/jsx-props-no-spreading": "off",
      "react/no-array-index-key": "warn",
      "react/require-default-props": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks-addons/no-unused-deps": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "tsconfig.app.json",
      },
      globals: {
        ...globals.browser,
      },
    },
  }
);
