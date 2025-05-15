export interface TokenSet {
	accessToken: string
	refreshToken: string
	expiresAt: number // epoch ms
}

export interface AuthClientOptions {
	clientId: string
	clientSecret: string
	redirectUri: string
	scope?: string[]
	fetch?: typeof globalThis.fetch
	load?: () => Promise<TokenSet | null>
	save?: (t: TokenSet) => Promise<void>
}

export interface AuthClient {
	/**
	 * Get the authorization URL for initiating the OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string }

	/**
	 * Exchange an authorization code for access and refresh tokens
	 */
	exchangeCodeForTokens(p: { code: string }): Promise<TokenSet>

	/**
	 * Refresh the access token using the refresh token
	 * @throws SchwabAuthError with code 'TOKEN_EXPIRED' if the refresh token has expired (after 7 days)
	 */
	refreshTokens(): Promise<TokenSet>

	/**
	 * Register a callback to be called when tokens are refreshed
	 */
	onRefresh(cb: (t: TokenSet) => void): void

	/**
	 * Check if the refresh token might be nearing expiration (Schwab refresh tokens expire after 7 days)
	 * @returns true if the refresh token is older than 6 days
	 */
	isRefreshTokenNearingExpiration(): boolean
}
