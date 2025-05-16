import { createAuthClient } from './auth-client'
import { createExtendedAuthClient } from './token-service'
import  { type TokenSet } from './types'

/**
 * A simplified interface for Schwab authentication operations
 */
export interface SchwabAuth {
	/**
	 * Exchanges an authorization code for tokens
	 * @param code The authorization code
	 * @returns A token set with access and refresh tokens
	 */
	exchangeCode(code: string): Promise<TokenSet>

	/**
	 * Refreshes an access token using the provided refresh token
	 * @param refreshToken The refresh token to use
	 * @param onSuccessfulPersist Optional callback that runs after successful refresh but before returning
	 * @returns A new token set
	 */
	refresh(
		refreshToken: string,
		onSuccessfulPersist?: (token: TokenSet) => Promise<void>,
	): Promise<TokenSet>
}

/**
 * Creates a simplified Schwab auth client with sensible defaults
 * @param config Configuration with clientId, clientSecret, and redirectUri
 * @returns A SchwabAuth implementation
 */
export function createSchwabAuthLite(config: {
	clientId: string
	clientSecret: string
	redirectUri: string
}): SchwabAuth {
	// Create a main auth client with the provided configuration
	const mainAuth = createAuthClient({
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		redirectUri: config.redirectUri,
		// We handle persistence externally by default
		load: async () => null,
		save: async () => {},
	})

	// Return the extended auth client
	return createExtendedAuthClient(mainAuth)
}
