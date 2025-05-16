import  { type TokenService } from './token-manager'
import  { type AuthClient, type TokenSet } from './types'

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

				// We register the callback but don't need to unregister
				// since we only use it once
				authClient.onRefresh((tokenSet) => {
					newTokenSet = {
						accessToken: tokenSet.accessToken,
						refreshToken: tokenSet.refreshToken || refreshToken, // Fall back to original if not returned
						expiresAt: tokenSet.expiresAt,
					}
				})

				// Use the auth client to refresh the token
				await authClient.refreshTokens()

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
		 * Refreshes an access token
		 * @param refreshToken The refresh token
		 * @param onSuccessfulPersist Optional callback for successful persistence
		 * @returns A new token set
		 */
		refresh: tokenService.refresh,
	}
}
