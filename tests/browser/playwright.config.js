const { defineConfig } = require("@playwright/test");
const path = require("node:path");
const os = require("node:os");

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "**/*.spec.js",
  outputDir: path.join(os.tmpdir(), "pantry-share-browser-tests"),
  use: {
    baseURL: "http://127.0.0.1:4181",
    browserName: "chromium",
    channel: process.env.CI ? "chrome" : undefined,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 4181 --bind 127.0.0.1 --directory docs",
    cwd: path.resolve(__dirname, "../.."),
    url: "http://127.0.0.1:4181",
    reuseExistingServer: false,
  },
});
