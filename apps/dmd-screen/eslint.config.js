import { globalIgnores } from "eslint/config";
import reactConfig from "@frontend/eslint-config/react";

export default [
  globalIgnores([
    "dist/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "eslint.config.js",
    "*.config.*",
  ]),
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
