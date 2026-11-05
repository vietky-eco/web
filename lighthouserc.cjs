const { chromium } = require("@playwright/test");

module.exports = {
  ci: {
    collect: {
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      startServerCommand: "npm run start",

      startServerReadyPattern: "Available on:",

      url: [
        "http://127.0.0.1:4173/"
      ],

      numberOfRuns: 2
    },

    assert: {
      assertions: {
        "categories:performance": [
          "warn",
          { minScore: 0.7 }
        ],

        "categories:accessibility": [
          "warn",
          { minScore: 0.85 }
        ],

        "categories:best-practices": [
          "warn",
          { minScore: 0.8 }
        ],

        "categories:seo": [
          "warn",
          { minScore: 0.8 }
        ]
      }
    },

    upload: {
      target: "filesystem",
      outputDir: "./lhci-report"
    }
  }
};
