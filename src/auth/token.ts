import { Issuer } from "openid-client";
import { type RequestContext } from "../core/http";
import { handleApiError, createSchwabApiError } from "../errors";
import { type SchwabTokenResponse } from "./types";
import {
  getTokenUrlWithContext,
  getAuthorizationUrlWithContext,
  getOAuthBaseUrlWithContext,
} from "./urls";

export interface ExchangeCodeForTokenOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  tokenUrl?: string; // default from getTokenUrlWithContext()
  fetch?: typeof fetch; // Optional fetch override
}

export interface RefreshTokenOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tokenUrl?: string; // default from getTokenUrlWithContext()
  fetch?: typeof fetch; // Optional fetch override
}

function createOidcClient(
  context: RequestContext,
  opts: {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    tokenUrl?: string;
  },
) {
  const issuer = new Issuer({
    issuer: getOAuthBaseUrlWithContext(context),
    authorization_endpoint: getAuthorizationUrlWithContext(context),
    token_endpoint: opts.tokenUrl || getTokenUrlWithContext(context),
  });

  return new issuer.Client({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uris: [opts.redirectUri || "http://localhost"],
    response_types: ["code"],
  });
}

/**
 * Utility function for logging in token-related functions with context
 */
function tokenLogWithContext(
  context: RequestContext,
  level: "info" | "error" | "warn",
  message: string,
  data?: any,
): void {
  const { config } = context;
  if (!config.enableLogging) return;

  const prefix = "[Schwab Auth]";

  if (data && level === "info") {
    console[level](`${prefix} ${message}`);
  } else if (data) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

/**
 * Exchange an authorization code for an access token using the provided context
 */
export async function exchangeCodeForTokenWithContext(
  context: RequestContext,
  opts: ExchangeCodeForTokenOptions,
): Promise<SchwabTokenResponse> {
  tokenLogWithContext(context, "info", "Exchanging code using openid-client");

  try {
    const client = createOidcClient(context, {
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      redirectUri: opts.redirectUri,
      tokenUrl: opts.tokenUrl,
    });

    const tokenSet = await client.callback(opts.redirectUri, {
      code: opts.code,
    });

    return {
      access_token: tokenSet.access_token as string,
      refresh_token: tokenSet.refresh_token,
      expires_in: tokenSet.expires_in || 0,
      token_type: tokenSet.token_type || "bearer",
    };
  } catch (error) {
    tokenLogWithContext(context, "error", "Error during token exchange:");
    handleApiError(error, "Token exchange failed");
  }
}

/**
 * Refresh an access token using a refresh token with context
 */
export async function refreshTokenWithContext(
  context: RequestContext,
  opts: RefreshTokenOptions,
): Promise<SchwabTokenResponse> {
  tokenLogWithContext(context, "info", "Refreshing token using openid-client");

  try {
    const client = createOidcClient(context, {
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      tokenUrl: opts.tokenUrl,
    });

    const tokenSet = await client.refresh(opts.refreshToken);

    return {
      access_token: tokenSet.access_token as string,
      refresh_token: tokenSet.refresh_token,
      expires_in: tokenSet.expires_in || 0,
      token_type: tokenSet.token_type || "bearer",
    };
  } catch (error) {
    tokenLogWithContext(context, "error", "Error during token refresh:");
    handleApiError(error, "Token refresh failed");
  }
}
