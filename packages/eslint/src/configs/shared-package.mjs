import createFromTsConfig from "./base-ts.mjs";
import { FILE_MATCHERS } from "./constants.js";

export default createFromTsConfig(
  // ==========================================
  // TYPESCRIPT (applies only to .ts, .tsx)
  // ==========================================
  {
    files: FILE_MATCHERS.ts,
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  }
);
