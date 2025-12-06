import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import { importX } from "eslint-plugin-import-x";
import turbo from "eslint-plugin-turbo";

export default defineConfig(
  {
    ignores: ["node_modules"],
  },
  turbo.configs["flat/recommended"],
  prettier,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  js.configs.recommended,
  {
    rules: {
      "import-x/extensions": ["error", "ignorePackages"],
      "import-x/no-extraneous-dependencies": "error",
      "import-x/order": [
        "error",
        {
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
          },
          groups: ["builtin", "external", "internal", "parent", "sibling"],
        },
      ],
      "import-x/prefer-default-export": "off",
      "operator-linebreak": ["error", "before"],
      "no-multiple-empty-lines": "error",
      "no-plusplus": "off",
      "no-shadow": "off",
      "no-use-before-define": "off",
      "no-void": [
        "error",
        {
          allowAsStatement: true,
        },
      ],
      "no-unused-vars": "off",
    },
    settings: {
      "import-x/resolver-next": [importX.createNodeResolver()],
    },
  }
);
