import { defineConfig } from "sanity"
import { deskTool } from "sanity/desk"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./schemas"

const isProd = process.env.NODE_ENV === "production"

export default defineConfig({
  name: "tc-management",
  title: "TC Management CMS",

  // ✅ Hardcodeado en producción, dinámico en desarrollo
  projectId: isProd ? "be45cp0a" : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: isProd ? "production" : process.env.NEXT_PUBLIC_SANITY_DATASET!,

  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})