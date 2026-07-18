// Hostinger Node.js Application Entry Point
// This file bootstraps the compiled Nitro server.

import('./.output/server/index.mjs').catch((err) => {
  console.error("Fatal error starting the Nitro server:", err);
  process.exit(1);
});
