import { type TokenService } from './token-manager'
import { type AuthClient, type TokenSet } from './types'

/**
 * Creates a TokenService implementation backed by an AuthClient
 * @param authClient The auth client to use for token operations
 * @returns A TokenService implementation
 */
export function createTokenService(authClient: AuthClient): TokenService {
	return {
		async refresh(
			refreshToken: string,
			onSuccessfulPersist?: (token: TokenSet) => Promise<void>,
		): Promise<TokenSet> {
			try {
				// Register a one-time callback to capture the new token
				let newTokenSet: TokenSet | null = null

				authClient.onRefresh((tokenSet) => {
					newTokenSet = {
						accessToken: tokenSet.accessToken,
						refreshToken: tokenSet.refreshToken || refreshToken, // Fall back to original if not returned
						expiresAt: tokenSet.expiresAt,
					}
				})

				// Call refreshTokens with the explicit refreshToken
				await authClient.refreshTokens({ refreshToken })

				// Verify we got a token set from the callback
				if (!newTokenSet) {
					throw new Error('Failed to get new token set from refresh operation')
				}

				// If a callback was provided, wait for it to complete before returning
				if (onSuccessfulPersist) {
					try {
						await onSuccessfulPersist(newTokenSet)
					} catch (persistError: unknown) {
						console.error('Failed to persist token:', persistError)
						// This is critical - throw the error to indicate persistence failure
						const errorMessage =
							persistError instanceof Error
								? persistError.message
								: String(persistError)
						throw new Error(`Token persistence failed: ${errorMessage}`)
					}
				}

				return newTokenSet
			} catch (error: unknown) {
				// Log error but don't expose internal details
				console.error('Token refresh failed:', error)
				throw error
			}
		},
	}
}

/**
 * Creates a simplified auth interface for exchanging codes and refreshing tokens
 * @param authClient The auth client to use
 * @returns An object with exchangeCode and refresh methods
 */
export function createExtendedAuthClient(authClient: AuthClient) {
	const tokenService = createTokenService(authClient)

	return {
		/**
		 * Exchanges an authorization code for tokens
		 * @param code The authorization code
		 * @returns A token set
		 */
		async exchangeCode(code: string): Promise<TokenSet> {
			const tokenSet = await authClient.exchangeCodeForTokens({ code })

			return {
				accessToken: tokenSet.accessToken,
				refreshToken: tokenSet.refreshToken || '',
				expiresAt: tokenSet.expiresAt,
			}
		},

		/**
		 * Refreshes an access token using a refresh token.
		 *
		 * IMPORTANT: Schwab refresh tokens expire after 7 days. When a refresh token expires,
		 * this method will throw a SchwabAuthError with code 'TOKEN_EXPIRED'. In this case,
		 * a new authorization flow must be initiated to obtain a new refresh token.
		 *
		 * @param refreshToken The refresh token to use
		 * @param onSuccessfulPersist Optional callback to persist the new token set
		 * @returns A new token set containing access and refresh tokens
		 * @throws SchwabAuthError with code 'TOKEN_EXPIRED' when the refresh token has expired
		 */
		refresh: tokenService.refresh,
	}
}
