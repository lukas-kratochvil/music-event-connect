import globals from "globals";
import createFromTsConfig from "./base-ts.mjs";

export default createFromTsConfig(
  // TypeScript language options (targeting only TypeScript files)
  {
    files: ["**/*.ts"],
    languageOptions: {
      sourceType: "commonjs",
      parserOptions: {
        project: "tsconfig.json",
      },
      globals: {
        ...globals.node,
      },
    },
  }
);
