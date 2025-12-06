import nestJs from "@darraghor/eslint-plugin-nestjs-typed";
import globals from "globals";
import ts from "typescript-eslint";
import baseTsConfig from "./base-ts.mjs";

export default ts.config(...baseTsConfig, nestJs.configs.flatRecommended, {
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
  rules: {
    "@darraghor/nestjs-typed/injectable-should-be-provided": [
      "warn",
      {
        src: ["src/**/*.ts"],
        filterFromPaths: [".spec.", ".test."],
      },
    ],

    "@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator": "error",
  },
});
