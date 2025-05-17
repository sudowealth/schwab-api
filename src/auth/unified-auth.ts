import { BaseTokenHandler } from './token-handler'
import {
	type AuthClientOptions,
	type TokenSet,
	type FullAuthClient,
} from './types'

// Re-export the FullAuthClient type to fix import issues
export type { FullAuthClient }

/**
 * Creates a comprehensive auth client that combines all authentication functionality:
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
	// Create an instance of the BaseTokenHandler
	const handler = new BaseTokenHandler(opts)

	// Return a unified interface that provides a simpler API
	return {
		// Simple wrapper for exchangeCode
		async exchangeCode(code: string): Promise<TokenSet> {
			return handler.exchangeCode(code)
		},

		// Simple wrapper for refreshTokens
		async refresh(
			refreshToken: string,
			options?: { force?: boolean },
		): Promise<TokenSet> {
			return handler.refreshTokens({
				refreshToken,
				force: options?.force,
			})
		},

		// Pass through the authorization URL generator
		getAuthorizationUrl: handler.getAuthorizationUrl.bind(handler),

		// Pass through load if available
		load: opts.load,

		// Pass through the onRefresh hook
		onRefresh: handler.onRefresh.bind(handler),
	}
}
