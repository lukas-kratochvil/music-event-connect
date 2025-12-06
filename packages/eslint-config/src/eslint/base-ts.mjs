import tsParser from "@typescript-eslint/parser";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import ts from "typescript-eslint";
import baseJsConfig from "./base-js.mjs";

export default ts.config(
  {
    ignores: ["public", "assets", "node_modules", "build", "dist"],
  },
  ...baseJsConfig,
  ts.configs.recommended,
  ts.configs.stylistic,
  {
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "import-x/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": "off", // let developer decide whether to use 'type' or 'interface'
      "@typescript-eslint/no-floating-promises": ["error"],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-shadow": "error",
    },
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver(), importX.createNodeResolver()],
    },
  }
);
