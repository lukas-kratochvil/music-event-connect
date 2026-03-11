import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import ts from "typescript-eslint";
import createFromJsConfig from "./base-js.mjs";
import { FILE_MATCHERS } from "./constants.js";

export default (...configs) =>
  createFromJsConfig(
    // ==========================================
    // TYPESCRIPT (applies only to .ts, .tsx)
    // ==========================================
    // using [].concat() safely handles both arrays and single objects exported by plugins
    ...[]
      .concat(ts.configs.recommended, ts.configs.stylistic, importX.flatConfigs.typescript)
      .flat()
      .map((config) => ({
        ...config,
        files: FILE_MATCHERS.ts,
      })),
    {
      files: FILE_MATCHERS.ts,
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      settings: {
        "import-x/resolver-next": [
          createTypeScriptImportResolver(), // look for TypeScript-specific (.ts, .tsx) file imported files, not just .js
          importX.createNodeResolver(), // fallback to try resolve file imports the standard Node way (look for .js, .json or third-party NPM packages)
        ],
      },
      rules: {
        "import-x/extensions": ["error", "ignorePackages", { ts: "never", tsx: "never" }],
        "no-restricted-imports": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
        "no-use-before-define": "off",
        "@typescript-eslint/consistent-type-definitions": "off", // let developer decide whether to use 'type' or 'interface'
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-restricted-imports": ["error"],
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { args: "all", argsIgnorePattern: "^_", ignoreRestSiblings: true },
        ],
        "@typescript-eslint/no-use-before-define": "error",
      },
    },

    // ==========================================
    // OTHER CONFIGS
    // ==========================================
    ...configs
  );
