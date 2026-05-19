import "dotenv/config";

console.log(process.env.KEYCLOAK_REDIRECT_URI)
function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable ${key}`);

  return value;
}

export const config = {
  port: process.env.PORT || 3001,

  session: {
    secret: require("SESSION_SECRET"),
    ttlMs: 1000 * 60 * 60 * 8, //8 hours
  },

  db: {
    connectionString: require("DATABASE_URL"),
  },

  keycloak: {
    issuerUrl: require("KEYCLOAK_ISSUER_URL"),
    clientId: require("KEYCLOAK_CLIENT_ID"),
    clientSecret: require("KEYCLOAK_CLIENT_SECRET"),
    redirectUri: require("KEYCLOAK_REDIRECT_URI"),
  },

  api: {
    baseUrl: require("API_BASE_URL"),
  },

  spa: {
    url: require("SPA_URL"),
  },
} as const;
