// TODO: Move buildAuthorizeUrl, SCHWAB_OAUTH_BASE here

export const SCHWAB_OAUTH_BASE = 'https://api.schwabapi.com/v1/oauth';

export interface BuildAuthorizeUrlOptions {
  clientId: string;
  redirectUri: string;
  scope?: string;      // e.g., "api offline_access"
  state?: string;
  baseUrl?: string;    // Overrides SCHWAB_OAUTH_BASE if provided
}

export function buildAuthorizeUrl(opts: BuildAuthorizeUrlOptions): string {
  const url = new URL(opts.baseUrl || SCHWAB_OAUTH_BASE + '/authorize');
  url.searchParams.set('client_id', opts.clientId);
  url.searchParams.set('redirect_uri', opts.redirectUri);
  if (opts.scope) {
    url.searchParams.set('scope', opts.scope);
  }
  if (opts.state) {
    url.searchParams.set('state', opts.state);
  }
  // Schwab requires response_type=code
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

// Placeholder for buildTokenUrl - might not be needed if exchangeCodeForToken handles it
// export function buildTokenUrl(baseUrl?: string): string {
//   return (baseUrl || SCHWAB_OAUTH_BASE) + '/token';
// } 