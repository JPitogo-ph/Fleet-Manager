import { app } from "./app.js";
import { config } from "./config.js";
import { getKeycloakConfig } from "./lib/keycloak.js";

async function start() {
  await getKeycloakConfig();
  console.log("Keycloak discovery successful");

  app.listen(config.port, () => {
    console.log(`BFF running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start BFF", err);
  process.exit(1);
});
