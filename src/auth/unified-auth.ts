import { createAuthClient } from './auth-client'
import { createExtendedAuthClient } from './token-service'
import { type AuthClientOptions, type TokenSet } from './types'

/**
 * Interface for a full auth client with both authorization URL generation
 * and token management capabilities.
 */
export interface FullAuthClient {
	// Exchange methods from extended client
	exchangeCode(code: string): Promise<TokenSet>
	refresh(refreshToken: string): Promise<TokenSet>

	// Authorization method from base client
	getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string }

	// Optional hook for refresh events
	onRefresh?(callback: (tokenSet: TokenSet) => void): void
}

/**
 * Creates a comprehensive auth client that combines both base and extended functionality:
 * - Generate an authorization URL for user login
 * - Exchange authorization codes for tokens
 * - Refresh tokens when needed
 *
 * This is the recommended approach for most applications, providing a simplified
 * interface for the complete OAuth flow.
 *
 * ## Token Refresh Handling
 *
 * Schwab refresh tokens expire after 7 days. When this happens, your application will
 * receive a `TOKEN_EXPIRED` error when attempting to refresh. When this occurs, you must
 * initiate a new authorization flow by:
 *
 * 1. Capturing the `SchwabAuthError` with code 'TOKEN_EXPIRED'
 * 2. Redirecting the user to re-authenticate using the authorization URL
 * 3. Exchanging the new authorization code for new tokens
 *
 * Example error handling:
 * ```typescript
 * try {
 *   const newTokens = await auth.refresh(oldRefreshToken);
 *   // Update stored tokens with newTokens
 * } catch (error) {
 *   if (error instanceof SchwabAuthError && error.code === 'TOKEN_EXPIRED') {
 *     // Refresh token has expired, redirect user to re-authenticate
 *     const { authUrl } = auth.getAuthorizationUrl();
 *     // Redirect user to authUrl
 *   } else {
 *     // Handle other errors
 *   }
 * }
 * ```
 */
export function createSchwabAuthClient(
	opts: AuthClientOptions,
): FullAuthClient {
	// Create base client for authorization URL generation
	const baseClient = createAuthClient(opts)

	// Create extended client for token exchange and refresh
	const extendedClient = createExtendedAuthClient(baseClient)

	// Return a unified interface with capabilities from both clients
	return {
		// Methods from extended client
		exchangeCode: extendedClient.exchangeCode,
		refresh: extendedClient.refresh,

		// Method from base client
		getAuthorizationUrl: baseClient.getAuthorizationUrl.bind(baseClient),

		// Optional onRefresh hook
		onRefresh: baseClient.onRefresh?.bind(baseClient),
	}
}
