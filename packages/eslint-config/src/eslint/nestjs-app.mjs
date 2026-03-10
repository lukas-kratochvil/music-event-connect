import nestJs from "@darraghor/eslint-plugin-nestjs-typed";
import globals from "globals";
import createFromTsConfig from "./base-ts.mjs";

export default createFromTsConfig(
  nestJs.configs.flatRecommended,
  // TypeScript language options (targeting only TypeScript files)
  {
    files: ["**/*.ts"],
    languageOptions: {
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
  }
);
