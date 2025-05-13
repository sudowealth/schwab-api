import { SCHWAB_OAUTH_BASE } from './urls';
import { SchwabApiError } from '../core/errors';
import { getSchwabApiConfig } from '../core/http';

export interface ExchangeCodeForTokenOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  tokenUrl?: string; // default SCHWAB_OAUTH_BASE + '/token'
}

export interface SchwabTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
  token_type: string;
}

export async function exchangeCodeForToken(opts: ExchangeCodeForTokenOptions): Promise<SchwabTokenResponse> {
  const { enableLogging } = getSchwabApiConfig();
  const tokenEndpoint = opts.tokenUrl || SCHWAB_OAUTH_BASE + '/token';

  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('code', opts.code);
  body.append('redirect_uri', opts.redirectUri);
  // client_id and client_secret are sent in Authorization header (Basic Auth)

  const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`);

  if (enableLogging) {
    console.log(`[Schwab API Client] Exchanging code for token at: ${tokenEndpoint}`);
  }

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      if (enableLogging) {
        console.error('[Schwab API Client] Token exchange failed:', data);
      }
      throw new SchwabApiError(`Token exchange failed with status ${response.status}`, {
        response,
        data,
        statusCode: response.status,
      });
    }
    if (enableLogging) {
      console.log('[Schwab API Client] Token exchange successful');
    }
    return data as SchwabTokenResponse;
  } catch (error) {
    if (enableLogging && !(error instanceof SchwabApiError)) {
      console.error('[Schwab API Client] Error during token exchange:', error);
    }
    if (error instanceof SchwabApiError) throw error;
    throw new SchwabApiError('Network or other error during token exchange.', { data: error });
  }
}

// Placeholder for refresh token functionality
// export interface RefreshTokenOptions { ... }
// export async function refreshToken(opts: RefreshTokenOptions): Promise<SchwabTokenResponse> { ... } 