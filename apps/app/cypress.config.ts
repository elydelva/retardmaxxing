import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3001",
    specPattern: "e2e/specs/**/*.cy.ts",
    supportFile: "e2e/support/e2e.ts",
    fixturesFolder: "e2e/fixtures",
    screenshotsFolder: "e2e/screenshots",
    videosFolder: "e2e/videos",
    downloadsFolder: "e2e/downloads",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
  },
});
