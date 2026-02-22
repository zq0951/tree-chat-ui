import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ]),
  // Allow <img> in node components — they render base64 data URLs
  // which next/image doesn't support.
  {
    files: ["components/node/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off"
    }
  }
]);

export default eslintConfig;
