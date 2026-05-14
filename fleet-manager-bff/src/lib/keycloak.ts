import * as client from "openid-client";
import { config } from "../config.js";

let _keycloakConfig: client.Configuration | null = null;

export async function getKeycloakConfig(): Promise<client.Configuration> {
  if (!_keycloakConfig) {
    _keycloakConfig = await client.discovery(
      new URL(config.keycloak.issuerUrl),
      config.keycloak.clientId,
      config.keycloak.clientSecret,
      undefined,
      ...(process.env.NODE_ENV !== "production" ? [{execute: [client.allowInsecureRequests]}] : [])
    )
  }

  return _keycloakConfig;
}

export async function getAuthorizationUrl(
  codeVerifier: string,
): Promise<{ url: URL; state: string }> {
  const kc = await getKeycloakConfig();

  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

  //openid-connect docs say to check if PKCE isn't supported.
  let state: string | undefined;
  const parameters: Record<string, string> = {
    redirect_uri: config.keycloak.redirectUri,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };

  if (!kc.serverMetadata().supportsPKCE()) {
    state = client.randomState();
    parameters.state = state;
  }

  const url = client.buildAuthorizationUrl(kc, parameters);

  return { url, state: state ?? "" };
}

export async function exchangeCodeForTokens(
  currentUrl: URL,
  codeVerifier: string,
  expectedState?: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
    const kc = await getKeycloakConfig()

    const tokens = await client.authorizationCodeGrant(kc, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        ...(expectedState ? {expectedState} : {})
    })

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        expiresAt: Date.now() + (tokens.expires_in as number) * 1000
    }
}

export async function   refreshAccessToken(refreshToken: string): Promise<{accessToken: string, refreshToken: string, expiresAt: number}> {
    const kc = await getKeycloakConfig()

    const tokens = await client.refreshTokenGrant(kc, refreshToken)

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        expiresAt: Date.now() + (tokens.expires_in as number) * 1000
    }
}
