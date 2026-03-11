import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import { importX } from "eslint-plugin-import-x";
import turbo from "eslint-plugin-turbo";
import globals from "globals";
import { FILE_MATCHERS } from "./constants.js";

export default (...configs) =>
  defineConfig(
    {
      ignores: ["public", "assets", "node_modules", "build", "dist"],
    },

    // ==========================================
    // GLOBAL (applies to ALL files)
    // ==========================================
    js.configs.recommended,
    turbo.configs["flat/recommended"],
    importX.flatConfigs.recommended,
    {
      settings: {
        "import-x/resolver-next": [importX.createNodeResolver()],
      },
      rules: {
        "import-x/extensions": ["error", "ignorePackages"],
        "import-x/no-extraneous-dependencies": "error",
        "import-x/order": [
          "error",
          {
            "newlines-between": "never",
            alphabetize: { order: "asc" },
            groups: ["builtin", "external", "internal", "parent", "sibling"],
          },
        ],
        "import-x/prefer-default-export": "off",
        "no-plusplus": "off",
        "no-void": ["error", { allowAsStatement: true }],
      },
    },

    // ==========================================
    // NODE SCRIPTS (.js, .mjs, .cjs)
    // ==========================================
    {
      files: FILE_MATCHERS.node,
      languageOptions: {
        globals: { ...globals.node },
      },
    },

    // ==========================================
    // OTHER CONFIGS
    // ==========================================
    ...configs,

    // ==========================================
    // PRETTIER (must be last)
    // ==========================================
    prettier // must be at the very end of every ESLint config so it overwrites ESLint formatting rules
  );
