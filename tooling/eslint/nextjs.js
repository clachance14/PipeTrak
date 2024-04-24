/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["plugin:@next/next/core-web-vitals"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@typescript-eslint/require-await": "off",
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never" },
    ],
  },
};

module.exports = config;
