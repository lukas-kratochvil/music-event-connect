import nestJs from "@darraghor/eslint-plugin-nestjs-typed";
import globals from "globals";
import createFromTsConfig from "./base-ts.mjs";
import { FILE_MATCHERS } from "./constants.js";

export default createFromTsConfig(
  // ==========================================
  // TYPESCRIPT (applies only to .ts)
  // ==========================================
  // using [].concat() safely handles both arrays and single objects exported by plugins
  ...[]
    .concat(nestJs.configs.flatRecommended)
    .flat()
    .map((config) => ({
      ...config,
      files: FILE_MATCHERS.ts,
    })),
  {
    files: FILE_MATCHERS.ts,
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json",
      },
      globals: { ...globals.node },
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
