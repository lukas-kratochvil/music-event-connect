import globals from "globals";
import ts from "typescript-eslint";
import baseTsConfig from "./base-ts.mjs";

export default ts.config(...baseTsConfig, {
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "commonjs",
    parserOptions: {
      project: "tsconfig.json",
    },
    globals: {
      ...globals.node,
    },
  },
});
