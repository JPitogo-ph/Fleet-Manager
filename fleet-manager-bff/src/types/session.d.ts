import "express-session";

declare module "express-session" {
  interface SessionData {
    codeVerifier?: string;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  }
}
