import { globalIgnores } from "eslint/config"
import reactConfig from "@frontend/eslint-config/react"

export default [
  globalIgnores([
    "**/dist/**",
    "**/node_modules/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/coverage/**",
    "**/eslint.config.js",
    "**/*.config.*",
    "packages/eslint-config/**/*.js",
  ]),
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
