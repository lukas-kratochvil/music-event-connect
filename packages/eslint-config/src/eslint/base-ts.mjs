import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import ts from "typescript-eslint";
import createFromJsConfig from "./base-js.mjs";

export default (...configs) =>
  createFromJsConfig(
    ts.configs.recommended,
    ts.configs.stylistic,
    // TypeScript language options (targeting only TypeScript files)
    {
      ...importX.flatConfigs.typescript,
      files: ["**/*.{ts,tsx}"],
    },
    {
      files: ["**/*.{ts,tsx}"],
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
        // overrides for rules already defined globally
        "import-x/extensions": ["error", "ignorePackages", { ts: "never", tsx: "never" }],

        // feature toggles
        "no-restricted-imports": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
        "no-use-before-define": "off",

        // TypeScript-specific rules
        "@typescript-eslint/consistent-type-definitions": "off", // let developer decide whether to use 'type' or 'interface'
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                regex: "^@mui/(?!x-date-pickers)[^/]+$",
                allowTypeImports: true,
                message: "In development, MUI barrel imports can cause significantly slower startup and rebuild times.",
              },
            ],
          },
        ],
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-unused-vars": ["warn", { args: "all", argsIgnorePattern: "^_" }],
        "@typescript-eslint/no-use-before-define": "error",
      },
    },
    // Other configs
    ...configs
  );
