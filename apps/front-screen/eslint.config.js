import reactConfig from "@frontend/eslint-config/react";

export default [
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
  {
    rules: {
      "react/no-unknown-property": "off",
    },
  },
  {
    ignores: ["dist/**"],
  },
];
