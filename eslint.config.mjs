import convexPlugin from "@convex-dev/eslint-plugin"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import { defineConfig } from "eslint/config"

export default defineConfig(
  [
    ...nextCoreWebVitals,
    ...nextTypescript,
    ...convexPlugin.configs.recommended,
  ],
  { ignores: ["src/convex/_generated/**"] }
)
