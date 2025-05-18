import { getSchwabApiConfigDefaults } from '../core/config'
import { createRequestContext } from '../core/http'
import { AuthErrorCode, SchwabAuthError } from '../errors'
import {
	exchangeCodeForTokenWithContext,
	refreshTokenWithContext,
} from './token'
import {
	tokenIsExpiringSoon,
	REFRESH_TOKEN_WARNING_THRESHOLD_MS,
} from './token-utils'
import {
	type SchwabTokenResponse,
	type TokenSet,
	type TokenData,
	type AuthClientOptions,
	type ITokenLifecycleManager,
	type RefreshOptions,
	type FullAuthClient,
} from './types'
import { buildAuthorizeUrlWithContext } from './urls'

/**
 * Helper to map the Schwab token response to our TokenSet interface
 */
export function mapTokenResponse(response: SchwabTokenResponse): TokenSet {
	return {
		accessToken: response.access_token,
		refreshToken: response.refresh_token || '',
		expiresAt: Date.now() + response.expires_in * 1000,
	}
}

/**
 * Base class for token handling operations. Provides core functionality for
 * managing OAuth tokens with Schwab API. This class implements ITokenLifecycleManager
 * to provide a consistent interface across the library.
 */
export class BaseTokenHandler implements ITokenLifecycleManager, Partial<FullAuthClient> {
	protected clientId: string
	protected clientSecret: string
	protected redirectUri: string
	protected fetchFn: typeof fetch
	protected loadTokens?: () => Promise<TokenSet | null>
	protected saveTokens?: (tokens: TokenSet) => Promise<void>
	protected defaultScope: string[]
	protected refreshTokenCreatedAt?: number
	protected refreshCallbacks: ((t: TokenSet) => void)[] = []
	protected tokenSet: TokenSet | null = null

	constructor(options: AuthClientOptions) {
		this.clientId = options.clientId
		this.clientSecret = options.clientSecret
		this.redirectUri = options.redirectUri
		this.fetchFn = options.fetch || fetch
		this.loadTokens = options.load
		this.saveTokens = options.save
		this.defaultScope = options.scope || ['api', 'offline_access']
	}

	/**
	 * Get the authorization URL for initiating the OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[] }): { authUrl: string } {
		const scope = opts?.scope || this.defaultScope

		// Create a request context for URL generation with default config
		const context = createRequestContext(
			getSchwabApiConfigDefaults(),
			this.fetchFn,
		)

		const authUrl = buildAuthorizeUrlWithContext(context, {
			clientId: this.clientId,
			redirectUri: this.redirectUri,
			scope: scope.join(' '),
		})

		return { authUrl }
	}

	/**
	 * Exchange an authorization code for access and refresh tokens
	 */
	async exchangeCode(code: string): Promise<TokenSet> {
		try {
			// Create a request context for token exchange
			const context = createRequestContext(
				getSchwabApiConfigDefaults(),
				this.fetchFn,
			)

			const response = await exchangeCodeForTokenWithContext(context, {
				clientId: this.clientId,
				clientSecret: this.clientSecret,
				code,
				redirectUri: this.redirectUri,
			})

			const tokenSet = mapTokenResponse(response)

			// Store the tokens internally
			this.tokenSet = tokenSet

			// Track when refresh token was obtained
			this.refreshTokenCreatedAt = Date.now()

			if (this.saveTokens) {
				await this.saveTokens(tokenSet)
			}

			return tokenSet
		} catch (error) {
			if (error instanceof SchwabAuthError) {
				throw error
			}

			// Map error details for consistency
			let code: AuthErrorCode = AuthErrorCode.UNKNOWN
			let message = 'Failed to exchange code for tokens'
			let status: number | undefined

			if (error instanceof Error) {
				message = error.message

				if ('status' in error && typeof (error as any).status === 'number') {
					status = (error as any).status

					if (status === 401) {
						code = AuthErrorCode.UNAUTHORIZED
					} else if (status === 400) {
						code = AuthErrorCode.INVALID_CODE
					}
				}
			}

			// Create a properly formatted auth error
			const authError = new SchwabAuthError(
				code,
				message,
				status,
				error instanceof Error ? { originalError: error } : undefined,
			)

			// Throw the properly formatted error
			throw authError
		}
	}

	/**
	 * Check if the refresh token might be nearing expiration
	 * @returns true if the refresh token is older than 6 days
	 */
	isRefreshTokenNearingExpiration(): boolean {
		return tokenIsExpiringSoon(
			this.refreshTokenCreatedAt,
			REFRESH_TOKEN_WARNING_THRESHOLD_MS,
		)
	}

	/**
	 * Refresh the access token using the refresh token
	 * @param options Optional refresh options
	 * @throws SchwabAuthError with code 'TOKEN_EXPIRED' if the refresh token has expired (after 7 days)
	 */
	async refreshTokens(options?: RefreshOptions): Promise<TokenSet> {
		try {
			// Try to load tokens if we have a load function
			let currentTokens: TokenSet | null = this.tokenSet
			let refreshTokenToUse = options?.refreshToken

			if (!refreshTokenToUse && !currentTokens && this.loadTokens) {
				currentTokens = await this.loadTokens()
				this.tokenSet = currentTokens
			}

			if (!refreshTokenToUse && currentTokens) {
				refreshTokenToUse = currentTokens.refreshToken
			}

			if (!refreshTokenToUse) {
				throw new SchwabAuthError(
					AuthErrorCode.TOKEN_EXPIRED,
					'No refresh token available',
				)
			}

			// Check if refresh token might be nearing expiration and log a warning
			// Skip if force is true - we'll refresh regardless of expiration status
			if (!options?.force && this.isRefreshTokenNearingExpiration()) {
				console.warn(
					'WARNING: Schwab refresh token is nearing its 7-day expiration limit. ' +
						'If refresh fails, a full re-authentication will be required.',
				)
			}

			// Create a request context for token refresh
			const context = createRequestContext(
				getSchwabApiConfigDefaults(),
				this.fetchFn,
			)

			const response = await refreshTokenWithContext(context, {
				clientId: this.clientId,
				clientSecret: this.clientSecret,
				refreshToken: refreshTokenToUse,
			})

			// Use the new refresh token if provided, otherwise keep the old one
			const refreshTokenToSave = response.refresh_token || refreshTokenToUse

			const tokenSet: TokenSet = {
				accessToken: response.access_token,
				refreshToken: refreshTokenToSave,
				expiresAt: Date.now() + response.expires_in * 1000,
			}

			// Store the tokens internally
			this.tokenSet = tokenSet

			if (this.saveTokens) {
				await this.saveTokens(tokenSet)
			}

			// Notify all refresh listeners
			this.notifyRefreshListeners(tokenSet)

			return tokenSet
		} catch (error) {
			if (error instanceof SchwabAuthError) {
				throw error
			}

			// Map errors to standardized types for consistent error handling
			let code: AuthErrorCode = AuthErrorCode.UNKNOWN
			let status: number | undefined
			let message = 'Failed to refresh tokens'

			if (error instanceof Error) {
				message = error.message

				// Check for specific error messages that indicate token expiration
				if (
					message.includes('refresh token authentication failed') ||
					message.includes('refresh_token_authentication_error')
				) {
					code = AuthErrorCode.TOKEN_EXPIRED
					message =
						'Refresh token has expired or been revoked. A new authorization flow is required.'
				} else if (
					'status' in error &&
					typeof (error as any).status === 'number'
				) {
					status = (error as any).status

					if (status === 401) {
						code = AuthErrorCode.UNAUTHORIZED
					} else if (status === 400) {
						// Check if this is a specific error we can better classify
						if ((error as any).data && (error as any).data.error) {
							const errorCode = (error as any).data.error
							if (
								errorCode === 'refresh_token_authentication_error' ||
								errorCode === 'unsupported_token_type'
							) {
								code = AuthErrorCode.TOKEN_EXPIRED
								message =
									'Refresh token has expired or is invalid. A new authorization flow is required.'
							}
						} else {
							code = AuthErrorCode.TOKEN_EXPIRED
						}
					}
				}
			}

			// Create a properly formatted auth error
			const authError = new SchwabAuthError(
				code,
				message,
				status,
				error instanceof Error ? { originalError: error } : undefined,
			)

			// Throw the properly formatted error
			throw authError
		}
	}

	/**
	 * Register a callback to be called when tokens are refreshed
	 */
	onRefresh(cb: (t: TokenSet) => void): void {
		this.refreshCallbacks.push(cb)
	}

	/**
	 * Notifies all registered refresh listeners about new tokens
	 */
	protected notifyRefreshListeners(tokenSet: TokenSet): void {
		this.refreshCallbacks.forEach((cb) => {
			try {
				cb(tokenSet)
			} catch (error) {
				console.error('Error in onRefresh callback:', error)
			}
		})
	}

	/**
	 * ITokenLifecycleManager implementation
	 */

	/**
	 * Gets token data from the stored tokens or by loading from storage
	 */
	async getTokenData(): Promise<TokenData | null> {
		try {
			// Try to load tokens if available
			if (!this.tokenSet && this.loadTokens) {
				this.tokenSet = await this.loadTokens()
			}

			if (!this.tokenSet) {
				return null
			}

			return {
				accessToken: this.tokenSet.accessToken,
				refreshToken: this.tokenSet.refreshToken,
				expiresAt: this.tokenSet.expiresAt,
			}
		} catch (error) {
			console.error('Failed to get token data:', error)
			return null
		}
	}

	/**
	 * Gets just the access token
	 * Reuses the getTokenData method for consistency
	 */
	async getAccessToken(): Promise<string | null> {
		const tokenData = await this.getTokenData()
		return tokenData ? tokenData.accessToken : null
	}

	/**
	 * Checks if this manager supports token refresh
	 */
	supportsRefresh(): boolean {
		return true
	}

	/**
	 * Refreshes the tokens if needed
	 * Adapter method for ITokenLifecycleManager compatibility
	 */
	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		const tokenSet = await this.refreshTokens(options)
		return {
			accessToken: tokenSet.accessToken,
			refreshToken: tokenSet.refreshToken,
			expiresAt: tokenSet.expiresAt,
		}
	}
}
