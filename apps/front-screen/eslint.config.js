import { globalIgnores } from "eslint/config"
import reactConfig from "@frontend/eslint-config/react"

export default [
  globalIgnores([
    "dist/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "eslint.config.js",
    "*.config.*",
    "scripts/**",
  ]),
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js", "packages/assets/src/fontUrls.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "react/no-unknown-property": "off",
    },
  },
]
