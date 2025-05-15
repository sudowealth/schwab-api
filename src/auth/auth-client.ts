import { SchwabAuthError } from './errors';
import { type SchwabTokenResponse, exchangeCodeForToken, refreshToken } from './token';
import { type TokenSet, type AuthClientOptions, type AuthClient } from './types';
import { AUTH_URL, TOKEN_URL, buildAuthorizeUrl } from './urls';

/**
 * Implementation of the AuthClient interface
 * 
 * NOTE ABOUT SCHWAB REFRESH TOKENS:
 * Schwab refresh tokens expire after 7 days. When this happens, users will need to
 * completely re-authenticate through the authorization flow. The refreshTokens() 
 * method will throw a SchwabAuthError with code 'TOKEN_EXPIRED' in this case.
 */
class AuthClientImpl implements AuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private defaultScope: string[];
  private refreshCallbacks: ((t: TokenSet) => void)[] = [];
  private fetchFn: typeof fetch;
  private loadTokens?: () => Promise<TokenSet | null>;
  private saveTokens?: (t: TokenSet) => Promise<void>;
  // Track when refresh token was obtained (used for expiration warnings)
  private refreshTokenCreatedAt?: number;

  constructor(options: AuthClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.defaultScope = options.scope || ['api', 'offline_access'];
    this.fetchFn = options.fetch || fetch;
    this.loadTokens = options.load;
    this.saveTokens = options.save;
  }

  /**
   * Get the authorization URL for initiating the OAuth flow
   */
  getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string } {
    const scope = opts?.scope || this.defaultScope;
    
    const authUrl = buildAuthorizeUrl({
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scope: scope.join(' '),
      baseUrl: AUTH_URL
    });

    return { authUrl };
  }

  /**
   * Exchange an authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(p: { code: string }): Promise<TokenSet> {
    try {
      const response = await exchangeCodeForToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        code: p.code,
        redirectUri: this.redirectUri,
        tokenUrl: TOKEN_URL,
        fetch: this.fetchFn
      });

      const tokenSet = this.mapTokenResponse(response);
      
      // Track when refresh token was obtained
      this.refreshTokenCreatedAt = Date.now();
      
      if (this.saveTokens) {
        await this.saveTokens(tokenSet);
      }

      return tokenSet;
    } catch (error) {
      if (error instanceof SchwabAuthError) {
        throw error;
      }

      // Map any other errors to our error types
      let code: 'INVALID_CODE' | 'UNAUTHORIZED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN';
      let status: number | undefined;
      let message = 'Failed to exchange code for tokens';

      if (error instanceof Error) {
        message = error.message;
        
        if ('status' in error && typeof (error as any).status === 'number') {
          status = (error as any).status;
          
          if (status === 401) {
            code = 'UNAUTHORIZED';
          } else if (status === 400) {
            code = 'INVALID_CODE';
          }
        }
      }

      throw new SchwabAuthError(code, message, status);
    }
  }

  /**
   * Check if the refresh token might be nearing expiration
   * Schwab refresh tokens expire after 7 days
   * @returns true if the refresh token is older than 6 days
   */
  isRefreshTokenNearingExpiration(): boolean {
    if (!this.refreshTokenCreatedAt) return false;
    
    // Calculate days since refresh token was obtained
    const daysSinceRefresh = (Date.now() - this.refreshTokenCreatedAt) / (1000 * 60 * 60 * 24);
    
    // Return true if more than 6 days old (warn before 7-day expiration)
    return daysSinceRefresh > 6;
  }

  /**
   * Refresh the access token using the refresh token
   * @throws SchwabAuthError with code 'TOKEN_EXPIRED' if the refresh token has expired (after 7 days)
   */
  async refreshTokens(): Promise<TokenSet> {
    try {
      // Try to load tokens if we have a load function
      let currentTokens: TokenSet | null = null;
      
      if (this.loadTokens) {
        currentTokens = await this.loadTokens();
      }

      if (!currentTokens || !currentTokens.refreshToken) {
        throw new SchwabAuthError('TOKEN_EXPIRED', 'No refresh token available');
      }
      
      // Check if refresh token might be nearing expiration and log a warning
      if (this.isRefreshTokenNearingExpiration()) {
        console.warn('WARNING: Schwab refresh token is nearing its 7-day expiration limit. ' +
                    'If refresh fails, a full re-authentication will be required.');
      }

      const response = await refreshToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        refreshToken: currentTokens.refreshToken,
        tokenUrl: TOKEN_URL,
        fetch: this.fetchFn
      });

      // Use the new refresh token if provided, otherwise keep the old one
      const refreshTokenToUse = response.refresh_token || currentTokens.refreshToken;
      
      const tokenSet: TokenSet = {
        accessToken: response.access_token,
        refreshToken: refreshTokenToUse,
        expiresAt: Date.now() + response.expires_in * 1000
      };

      if (this.saveTokens) {
        await this.saveTokens(tokenSet);
      }

      // Notify all refresh listeners
      this.refreshCallbacks.forEach(cb => {
        try {
          cb(tokenSet);
        } catch (error) {
          console.error('Error in onRefresh callback:', error);
        }
      });

      return tokenSet;
    } catch (error) {
      if (error instanceof SchwabAuthError) {
        throw error;
      }

      // Map errors to our error types
      let code: 'UNAUTHORIZED' | 'TOKEN_EXPIRED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN';
      let status: number | undefined;
      let message = 'Failed to refresh tokens';

      if (error instanceof Error) {
        message = error.message;
        
        if ('status' in error && typeof (error as any).status === 'number') {
          status = (error as any).status;
          
          if (status === 401) {
            code = 'UNAUTHORIZED';
          } else if (status === 400) {
            code = 'TOKEN_EXPIRED';
          }
        }
      }

      throw new SchwabAuthError(code, message, status);
    }
  }

  /**
   * Register a callback to be called when tokens are refreshed
   */
  onRefresh(cb: (t: TokenSet) => void): void {
    this.refreshCallbacks.push(cb);
  }

  /**
   * Helper to map the Schwab token response to our TokenSet interface
   */
  private mapTokenResponse(response: SchwabTokenResponse): TokenSet {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token || '',
      expiresAt: Date.now() + response.expires_in * 1000
    };
  }
}

/**
 * Create a new authentication client
 */
export function createAuthClient(opts: AuthClientOptions): AuthClient {
  return new AuthClientImpl(opts);
}