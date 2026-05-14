import { Router } from "express";
import * as oidc from "openid-client";
import { getAuthorizationUrl, exchangeCodeForTokens } from "../lib/keycloak.js";
import { config } from "../config.js";
import type { Request, Response, NextFunction } from "express";

export const authRouter = Router();

//Generate code verifier, store in session, redirect to Keycloak
authRouter.get(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codeVerifier = oidc.randomPKCECodeVerifier();

      //Added property to express native SessionData type, store in session before redirect, needed for code exchange
      req.session.codeVerifier = codeVerifier;

      const authUrl = await getAuthorizationUrl(codeVerifier);

      res.redirect(authUrl.url.href);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get(
  "/exchange",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codeVerifier = req.session.codeVerifier;
      if (!codeVerifier)
        return res.status(400).json({ error: "Missing code verifier" });

      //open-id client needs full current URL to extract KC params
      const currentUrl = new URL(
        req.originalUrl,
        `${req.protocol}://${req.get("host")}`,
      );

      console.log(currentUrl)

      const tokens = await exchangeCodeForTokens(currentUrl, codeVerifier);

      delete req.session.codeVerifier;

      req.session.tokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      };

      res.redirect(config.spa.url);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kc = await import("../lib/keycloak.js");
      const keycloakConfig = await kc.getKeycloakConfig();

      req.session.destroy((err) => {
        if (err) return next(err);

        //Build KC logout url
        //Docs suggest id_token_hint for silent logout. Something to consider for fuller logout implementation
        const logoutUrl = oidc.buildEndSessionUrl(keycloakConfig, {
          post_logout_redirect_uri: config.spa.url,
        });

        res.redirect(logoutUrl.href);
      });
    } catch (err) {
      next(err);
    }
  },
);
