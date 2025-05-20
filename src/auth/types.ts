/**
 * Centralized types for authentication and token management
 */

/**
 * Represents the response from a token API call
 *
 * @internal This interface is primarily used by internal auth components
 */
export interface SchwabTokenResponse {
	access_token: string
	refresh_token?: string
	expires_in: number // Seconds until expiration
	token_type: string
}

/**
 * Represents a set of authentication tokens including access token,
 * refresh token, and expiration time.
 */
export interface TokenSet {
	accessToken: string
	refreshToken: string
	expiresAt: number // epoch ms
}

/**
 * Consolidated token interface representing a set of tokens
 * with access token, optional refresh token, and expiration.
 *
 * Similar to TokenSet but with optional refreshToken and expiresAt.
 */
export interface TokenData {
	/**
	 * The access token used for API authentication
	 */
	accessToken: string

	/**
	 * Optional refresh token for refreshing the access token
	 * If present, indicates the token can be refreshed
	 */
	refreshToken?: string

	/**
	 * Expiration time in epoch milliseconds
	 * Used to determine when the token needs refreshing
	 */
	expiresAt?: number
}

/**
 * Options for token refresh operations
 */
export interface RefreshOptions {
	/**
	 * Force a refresh even if the token is not expired
	 */
	force?: boolean

	/**
	 * Optional explicit refresh token to use
	 */
	refreshToken?: string
}

/**
 * Unified interface for token management that covers both simple
 * and refreshable token scenarios.
 */
export interface ITokenLifecycleManager {
	/**
	 * Get the current token data
	 * @returns TokenData containing at minimum an accessToken, or null if no token is available
	 */
	getTokenData(): Promise<TokenData | null>

	/**
	 * Get just the access token string
	 * @returns The access token string or null if no token is available
	 */
	getAccessToken(): Promise<string | null>

	/**
	 * Check if this manager supports token refresh
	 * Implementation should return true if refreshToken is provided
	 * and refreshIfNeeded is implemented
	 */
	supportsRefresh(): boolean

	/**
	 * Refresh the token if needed and supported
	 * @param options Optional parameters to control refresh behavior
	 * @returns The new token data
	 * @throws Error if refresh is not supported or fails
	 */
	refreshIfNeeded?(options?: RefreshOptions): Promise<TokenData>

	/**
	 * Register a callback to be called when tokens are refreshed
	 * Optional method that should be implemented if refreshIfNeeded is implemented
	 * @param callback Function to call when tokens are refreshed
	 */
	onRefresh?(callback: (tokenData: TokenData) => void): void
}

/**
 * Configuration options for the TokenLifecycleManager
 */
export interface TokenManagerOptions {
	/**
	 * Maximum number of concurrent refresh operations
	 * @default 1
	 */
	maxConcurrency?: number
}

/**
 * Options for authenticating with the Schwab API
 */
export interface AuthClientOptions {
	/**
	 * Client ID for the application
	 */
	clientId: string

	/**
	 * Client secret for the application
	 */
	clientSecret: string

	/**
	 * Redirect URI for the OAuth flow
	 */
	redirectUri: string

	/**
	 * OAuth scopes to request
	 * @default ['api', 'offline_access']
	 */
	scope?: string[]

	/**
	 * Custom fetch implementation
	 * @default globalThis.fetch
	 */
	fetch?: typeof globalThis.fetch

	/**
	 * Function to load tokens from storage
	 */
	load?: () => Promise<TokenSet | null>

	/**
	 * Function to save tokens to storage
	 */
	save?: (t: TokenSet) => Promise<void>
}

/**
 * Interface for a full auth client with both authorization URL generation
 * and token management capabilities.
 */
export interface FullAuthClient extends ITokenLifecycleManager {
	/**
	 * Exchange an authorization code for tokens
	 */
	exchangeCode(code: string): Promise<TokenSet>

	/**
	 * Refresh the access token using a refresh token
	 * @param refreshToken The refresh token to use
	 * @param options Additional refresh options
	 */
	refresh(
		refreshToken: string,
		options?: { force?: boolean },
	): Promise<TokenSet>

	/**
	 * Get the authorization URL for the OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string }

	/**
	 * Load tokens from storage if available
	 */
	load?(): Promise<TokenSet | null>

	/**
	 * Manually save tokens
	 * @param tokens The token set to save
	 * @param metadata Optional metadata about the save operation
	 */
	saveTokens?(
		tokens: Partial<TokenSet>,
		metadata?: Record<string, any>,
	): Promise<void>

	/**
	 * Register a callback for token refresh events
	 */
	onRefresh?(callback: (tokenSet: TokenSet) => void): void
}
