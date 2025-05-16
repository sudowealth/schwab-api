import { SchwabAuthError } from './errors'
import {
	type SchwabTokenResponse,
	exchangeCodeForToken,
	refreshToken,
} from './token'
import { type TokenSet, type AuthClientOptions, type AuthClient } from './types'
import { buildAuthorizeUrl } from './urls'

/**
 * Helper to map the Schwab token response to our TokenSet interface
 */
function mapTokenResponse(response: SchwabTokenResponse): TokenSet {
	return {
		accessToken: response.access_token,
		refreshToken: response.refresh_token || '',
		expiresAt: Date.now() + response.expires_in * 1000,
	}
}

/**
 * Check if the refresh token might be nearing expiration
 * Schwab refresh tokens expire after 7 days
 * @returns true if the refresh token is older than 6 days
 */
function isRefreshTokenNearingExpiration(
	refreshTokenCreatedAt?: number,
): boolean {
	if (!refreshTokenCreatedAt) return false

	// Calculate days since refresh token was obtained
	const daysSinceRefresh =
		(Date.now() - refreshTokenCreatedAt) / (1000 * 60 * 60 * 24)

	// Return true if more than 6 days old (warn before 7-day expiration)
	return daysSinceRefresh > 6
}

/**
 * Create a new authentication client using a functional approach
 *
 * NOTE ABOUT SCHWAB REFRESH TOKENS:
 * Schwab refresh tokens expire after 7 days. When this happens, users will need to
 * completely re-authenticate through the authorization flow. The refreshTokens()
 * method will throw a SchwabAuthError with code 'TOKEN_EXPIRED' in this case.
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
	const {
		clientId,
		clientSecret,
		redirectUri,
		fetch: fetchFn = fetch,
		load: loadTokens,
		save: saveTokens,
		scope: defaultScope = ['api', 'offline_access'],
	} = options

	// Closure state
	let refreshTokenCreatedAt: number | undefined
	const refreshCallbacks: ((t: TokenSet) => void)[] = []

	return {
		/**
		 * Get the authorization URL for initiating the OAuth flow
		 */
		getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string } {
			const scope = opts?.scope || defaultScope

			const authUrl = buildAuthorizeUrl({
				clientId,
				redirectUri,
				scope: scope.join(' '),
			})

			return { authUrl }
		},

		/**
		 * Exchange an authorization code for access and refresh tokens
		 */
		async exchangeCodeForTokens(p: { code: string }): Promise<TokenSet> {
			try {
				const response = await exchangeCodeForToken({
					clientId,
					clientSecret,
					code: p.code,
					redirectUri,
					fetch: fetchFn,
				})

				const tokenSet = mapTokenResponse(response)

				// Track when refresh token was obtained
				refreshTokenCreatedAt = Date.now()

				if (saveTokens) {
					await saveTokens(tokenSet)
				}

				return tokenSet
			} catch (error) {
				if (error instanceof SchwabAuthError) {
					throw error
				}

				// Map any other errors to our error types
				let code: 'INVALID_CODE' | 'UNAUTHORIZED' | 'NETWORK' | 'UNKNOWN' =
					'UNKNOWN'
				let status: number | undefined
				let message = 'Failed to exchange code for tokens'

				if (error instanceof Error) {
					message = error.message

					if ('status' in error && typeof (error as any).status === 'number') {
						status = (error as any).status

						if (status === 401) {
							code = 'UNAUTHORIZED'
						} else if (status === 400) {
							code = 'INVALID_CODE'
						}
					}
				}

				throw new SchwabAuthError(code, message, status)
			}
		},

		/**
		 * Check if the refresh token might be nearing expiration
		 * @returns true if the refresh token is older than 6 days
		 */
		isRefreshTokenNearingExpiration(): boolean {
			return isRefreshTokenNearingExpiration(refreshTokenCreatedAt)
		},

		/**
		 * Refresh the access token using the refresh token
		 * @param options Optional refresh options
		 * @throws SchwabAuthError with code 'TOKEN_EXPIRED' if the refresh token has expired (after 7 days)
		 */
		async refreshTokens(options?: {
			refreshToken?: string
		}): Promise<TokenSet> {
			try {
				// Try to load tokens if we have a load function
				let currentTokens: TokenSet | null = null
				let refreshTokenToUse = options?.refreshToken

				if (!refreshTokenToUse && loadTokens) {
					currentTokens = await loadTokens()
					refreshTokenToUse = currentTokens?.refreshToken
				}

				if (!refreshTokenToUse) {
					throw new SchwabAuthError(
						'TOKEN_EXPIRED',
						'No refresh token available',
					)
				}

				// Check if refresh token might be nearing expiration and log a warning
				if (isRefreshTokenNearingExpiration(refreshTokenCreatedAt)) {
					console.warn(
						'WARNING: Schwab refresh token is nearing its 7-day expiration limit. ' +
							'If refresh fails, a full re-authentication will be required.',
					)
				}

				const response = await refreshToken({
					clientId,
					clientSecret,
					refreshToken: refreshTokenToUse,
					fetch: fetchFn,
				})

				// Use the new refresh token if provided, otherwise keep the old one
				const refreshTokenToSave = response.refresh_token || refreshTokenToUse

				const tokenSet: TokenSet = {
					accessToken: response.access_token,
					refreshToken: refreshTokenToSave,
					expiresAt: Date.now() + response.expires_in * 1000,
				}

				if (saveTokens) {
					await saveTokens(tokenSet)
				}

				// Notify all refresh listeners
				refreshCallbacks.forEach((cb) => {
					try {
						cb(tokenSet)
					} catch (error) {
						console.error('Error in onRefresh callback:', error)
					}
				})

				return tokenSet
			} catch (error) {
				if (error instanceof SchwabAuthError) {
					throw error
				}

				// Map errors to our error types
				let code: 'UNAUTHORIZED' | 'TOKEN_EXPIRED' | 'NETWORK' | 'UNKNOWN' =
					'UNKNOWN'
				let status: number | undefined
				let message = 'Failed to refresh tokens'

				if (error instanceof Error) {
					message = error.message

					if ('status' in error && typeof (error as any).status === 'number') {
						status = (error as any).status

						if (status === 401) {
							code = 'UNAUTHORIZED'
						} else if (status === 400) {
							code = 'TOKEN_EXPIRED'
						}
					}
				}

				throw new SchwabAuthError(code, message, status)
			}
		},

		/**
		 * Register a callback to be called when tokens are refreshed
		 */
		onRefresh(cb: (t: TokenSet) => void): void {
			refreshCallbacks.push(cb)
		},
	}
}
