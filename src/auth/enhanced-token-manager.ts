import * as oidc from 'openid-client'
import { API_URLS, API_VERSIONS } from '../constants'
import { SchwabAuthError } from '../errors'
import { TokenRefreshTracer } from './token-refresh-tracer'
import {
	type TokenData,
	type TokenSet,
	type RefreshOptions,
	type AuthClientOptions,
	type FullAuthClient,
} from './types'

// Define additional error codes for enhanced token manager
export enum TokenErrorCode {
	AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
	REFRESH_FAILED = 'REFRESH_FAILED',
}

/**
 * Enhanced events for token persistence lifecycle
 */
export enum TokenPersistenceEvent {
	TOKEN_SAVED = 'token_saved',
	TOKEN_SAVE_FAILED = 'token_save_failed',
	TOKEN_LOADED = 'token_loaded',
	TOKEN_LOAD_FAILED = 'token_load_failed',
	TOKEN_VALIDATED = 'token_validated',
	TOKEN_VALIDATION_FAILED = 'token_validation_failed',
}

/**
 * Type for token persistence event handlers
 */
export type TokenPersistenceEventHandler = (
	event: TokenPersistenceEvent,
	data: TokenData,
	metadata?: Record<string, any>,
) => void

// Default constants for token management
export const DEFAULT_REFRESH_THRESHOLD_MS = 300_000 // 5 minutes
export const REFRESH_TOKEN_EXPIRATION_MS = 604_800_000 // 7 days
export const REFRESH_TOKEN_WARNING_THRESHOLD_MS = 518_400_000 // 6 days

/**
 * Enhanced token manager configuration options
 */
export interface EnhancedTokenManagerOptions extends AuthClientOptions {
	/**
	 * Maximum number of retry attempts for token refresh
	 * @default 3
	 */
	maxRetryAttempts?: number

	/**
	 * Initial delay in milliseconds before retrying a failed operation
	 * @default 1000 (1 second)
	 */
	initialRetryDelayMs?: number

	/**
	 * Maximum delay in milliseconds between retry attempts
	 * @default 30000 (30 seconds)
	 */
	maxRetryDelayMs?: number

	/**
	 * Whether to use exponential backoff for retries
	 * @default true
	 */
	useExponentialBackoff?: boolean

	/**
	 * Threshold in milliseconds before token expiration to trigger refresh
	 * @default 300000 (5 minutes)
	 */
	refreshThresholdMs?: number

	/**
	 * Enable detailed debug mode
	 * @default false
	 */
	debug?: boolean

	/**
	 * Enable token validation before operations
	 * @default true
	 */
	validateTokens?: boolean

	/**
	 * Enable auto-reconnection handling
	 * @default true
	 */
	autoReconnect?: boolean

	/**
	 * Handler for token lifecycle events
	 */
	onTokenEvent?: TokenPersistenceEventHandler

	/**
	 * Enable tracing of all token operations
	 * @default false
	 */
	traceOperations?: boolean

	/**
	 * Base URL for the issuer
	 * @default API_URLS.PRODUCTION/API_VERSIONS.v1
	 */
	issuerBaseUrl?: string
}

/**
 * Enhanced token manager that provides improved token lifecycle management,
 * with robust persistence, validation, retry logic, and reconnection handling.
 */
export class EnhancedTokenManager implements FullAuthClient {
	private config: Required<
		Omit<EnhancedTokenManagerOptions, 'save' | 'load' | 'onTokenEvent'>
	> & {
		save: AuthClientOptions['save']
		load: AuthClientOptions['load']
		onTokenEvent: TokenPersistenceEventHandler | undefined
	}

	// OIDC configuration for direct token management
	private oidcConfig: oidc.Configuration
	private tokenSet?: oidc.TokenEndpointResponse &
		oidc.TokenEndpointResponseHelpers

	// Persistence-related properties (integrated from TokenPersistenceManager)
	private saveFn?: (tokens: TokenSet) => Promise<void>
	private loadFn?: () => Promise<TokenSet | null>
	private persistenceDebugEnabled: boolean
	private validateOnLoad: boolean
	private persistenceEventHandler?: TokenPersistenceEventHandler
	private lastSavedTokens?: TokenData
	private lastLoadedTokens?: TokenData

	private tracer: TokenRefreshTracer
	private refreshCallbacks: Array<(t: TokenSet) => void> = []
	private reconnectionHandlers: Array<() => Promise<void>> = []
	private isReconnecting: boolean = false
	private lastRefreshAttempt: number = 0
	private refreshLock: Promise<TokenData> | null = null

	constructor(options: EnhancedTokenManagerOptions) {
		// Set default configuration values
		const baseIssuerUrl =
			options.issuerBaseUrl ?? `${API_URLS.PRODUCTION}/${API_VERSIONS.v1}`

		this.config = {
			clientId: options.clientId,
			clientSecret: options.clientSecret,
			redirectUri: options.redirectUri,
			scope: options.scope || ['api', 'offline_access'],
			fetch: options.fetch || globalThis.fetch,
			load: options.load,
			save: options.save,
			maxRetryAttempts: options.maxRetryAttempts ?? 3,
			initialRetryDelayMs: options.initialRetryDelayMs ?? 1000,
			maxRetryDelayMs: options.maxRetryDelayMs ?? 30000,
			useExponentialBackoff: options.useExponentialBackoff !== false,
			refreshThresholdMs:
				options.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS,
			debug: options.debug ?? false,
			validateTokens: options.validateTokens !== false,
			autoReconnect: options.autoReconnect !== false,
			onTokenEvent: options.onTokenEvent,
			traceOperations: options.traceOperations ?? false,
			issuerBaseUrl: baseIssuerUrl,
		}

		// Initialize OIDC configuration for token management
		const server = {
			issuer: baseIssuerUrl,
			authorization_endpoint: `${baseIssuerUrl}/oauth/authorize`,
			token_endpoint: `${baseIssuerUrl}/oauth/token`,
		} as oidc.ServerMetadata

		this.oidcConfig = new oidc.Configuration(server, this.config.clientId, {
			client_secret: this.config.clientSecret,
			redirect_uris: [this.config.redirectUri],
		})

		// Create dummy implementations for when the actual functions are missing
		const dummySave =
			this.config.save ||
			(async () => {
				if (this.config.debug)
					console.debug('[EnhancedTokenManager] No save function provided')
			})

		const dummyLoad =
			this.config.load ||
			(async () => {
				if (this.config.debug)
					console.debug('[EnhancedTokenManager] No load function provided')
				return null
			})

		const dummyEventHandler =
			this.config.onTokenEvent ||
			((event, data) => {
				if (this.config.debug)
					console.debug(`[EnhancedTokenManager] Event: ${event}`, data)
			})

		// Initialize persistence-related properties (integrated from TokenPersistenceManager)
		this.saveFn = dummySave
		this.loadFn = dummyLoad
		this.persistenceDebugEnabled = this.config.debug
		this.validateOnLoad = this.config.validateTokens
		this.persistenceEventHandler = dummyEventHandler
		this.lastSavedTokens = undefined
		this.lastLoadedTokens = undefined

		// Initialize tracer
		this.tracer = TokenRefreshTracer.getInstance({
			includeRawResponses: this.config.debug,
		})

		// Log configuration in debug mode
		if (this.config.debug) {
			console.debug('[EnhancedTokenManager] Initialized with config:', {
				clientIdLength: this.config.clientId.length,
				hasClientSecret: !!this.config.clientSecret,
				redirectUri: this.config.redirectUri,
				scope: this.config.scope,
				maxRetryAttempts: this.config.maxRetryAttempts,
				refreshThresholdMs: this.config.refreshThresholdMs,
				debug: this.config.debug,
				validateTokens: this.config.validateTokens,
				autoReconnect: this.config.autoReconnect,
				hasLoad: !!this.config.load,
				hasSave: !!this.config.save,
				hasTokenEventHandler: !!this.config.onTokenEvent,
			})
		}

		// Add default reconnection handler if auto-reconnect is enabled
		if (this.config.autoReconnect) {
			this.onReconnection(this.handleAutoReconnect.bind(this))
		}
	}

	/**
	 * Check if an access token is nearing expiration and needs refreshing
	 * @param expiresAt Timestamp when the token expires
	 * @param refreshThresholdMs Time before expiration to trigger refresh (default: 5 minutes)
	 * @returns True if token should be refreshed
	 */
	isAccessTokenNearingExpiration(
		expiresAt?: number,
		refreshThresholdMs: number = DEFAULT_REFRESH_THRESHOLD_MS,
	): boolean {
		if (!expiresAt) return false
		return expiresAt <= Date.now() + refreshThresholdMs
	}

	/**
	 * Check if a refresh token might be nearing its 7-day expiration limit
	 * Schwab refresh tokens expire after 7 days of inactivity
	 * @param refreshTokenCreatedAt Timestamp when the refresh token was created
	 * @returns true if the refresh token is older than 6 days (nearing expiration)
	 */
	isRefreshTokenNearingExpiration(refreshTokenCreatedAt?: number): boolean {
		if (!refreshTokenCreatedAt) return false

		// Check if refresh token is older than 6 days
		return (
			Date.now() - refreshTokenCreatedAt > REFRESH_TOKEN_WARNING_THRESHOLD_MS
		)
	}

	/**
	 * Unified method to check if any token is approaching expiration
	 * Can be used for both access tokens and refresh tokens with appropriate parameters
	 *
	 * @param expirationTime The timestamp to check against, or undefined
	 * @param thresholdMs Time threshold before expiration to return true
	 * @returns True if the token is expiring within the threshold window
	 */
	tokenIsExpiringSoon(
		expirationTime?: number,
		thresholdMs: number = DEFAULT_REFRESH_THRESHOLD_MS,
	): boolean {
		if (!expirationTime) return false

		// For standard expiration timestamps (expiresAt), we check if we're within threshold of expiry
		if (expirationTime > Date.now()) {
			return expirationTime <= Date.now() + thresholdMs
		}

		// For creation timestamps (refreshTokenCreatedAt), we check if we've exceeded the threshold
		return Date.now() - expirationTime > thresholdMs
	}

	/**
	 * Determine if tokens need refreshing based on comprehensive checks
	 * @param tokens The token data to check
	 * @param refreshTokenCreatedAt When the refresh token was created
	 * @param refreshThresholdMs Time before expiration to trigger refresh
	 * @returns True if tokens should be refreshed
	 */
	shouldRefreshTokens(
		tokens: TokenData | TokenSet | null | undefined,
		refreshTokenCreatedAt?: number,
		refreshThresholdMs: number = DEFAULT_REFRESH_THRESHOLD_MS,
	): boolean {
		// No tokens available
		if (!tokens) return false

		// Get expiresAt from either TokenData or TokenSet
		const expiresAt = 'expiresAt' in tokens ? tokens.expiresAt : undefined

		// If token is expiring soon or already expired
		return this.tokenIsExpiringSoon(expiresAt, refreshThresholdMs)
	}

	/**
	 * Get the authorization URL for OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[]; state?: string }): {
		authUrl: string
	} {
		const redirectUris = this.oidcConfig.clientMetadata().redirect_uris as
			| string[]
			| undefined
		const redirectUri = (redirectUris ? redirectUris[0] : '') as string
		const parameters: Record<string, string> = {
			redirect_uri: redirectUri,
			scope: (opts?.scope ?? this.config.scope).join(' '),
		}
		if (opts?.state) parameters.state = opts.state
		const url = oidc.buildAuthorizationUrl(this.oidcConfig, parameters)
		return { authUrl: url.toString() }
	}

	/**
	 * Exchange an authorization code for tokens
	 */
	async exchangeCode(code: string): Promise<TokenSet> {
		try {
			// Ensure code is properly formatted
			let formattedCode = code.trim()

			// Handle URL-encoded '@' character (%40)
			if (formattedCode.endsWith('%40')) {
				formattedCode = formattedCode.replace(/%40$/, '@')
			}

			// Schwab OAuth codes have special format (C0.xxx.xxx@)
			// Special handling for base64 encoding requirements
			if (formattedCode.endsWith('@')) {
				// For codes ending with @, special padding is needed to make the length a multiple of 4
				// Adding '=' characters for proper base64 padding
				while (formattedCode.length % 4 !== 0) {
					formattedCode += '='
				}
			}

			// Get token endpoint and credentials
			const redirectUris = this.oidcConfig.clientMetadata().redirect_uris as
				| string[]
				| undefined
			const redirectUri = (redirectUris ? redirectUris[0] : '') as string
			const tokenEndpoint = this.oidcConfig.serverMetadata().token_endpoint!
			const clientId = this.oidcConfig.clientMetadata().client_id
			const clientSecret = this.oidcConfig.clientMetadata()
				.client_secret as string

			// Log the details for debugging
			if (this.config.debug) {
				console.info('[INFO] Preparing token exchange request', {
					codeLength: formattedCode.length,
					codeEndsWithAt: formattedCode.endsWith('@'),
					codeEndsWithEncodedAt: formattedCode.endsWith('%40'),
					codeFinalChar: formattedCode.charAt(formattedCode.length - 1),
					redirectUri,
				})
			}

			// Make direct token request
			const tokenData = await this.makeTokenRequest(
				tokenEndpoint,
				{
					grant_type: 'authorization_code',
					code: formattedCode,
					redirect_uri: redirectUri,
				},
				clientId,
				clientSecret,
			)

			// Store the token set
			this.tokenSet = tokenData

			// Convert to TokenSet format
			const tokenSet = this.mapTokenSet(tokenData)

			// Trace the token exchange
			if (this.config.traceOperations) {
				this.tracer.recordTokenValidation(
					true,
					tokenSet,
					'Tokens obtained from code exchange',
				)
			}

			// Save tokens to persistence store
			await this.saveTokens(tokenSet, {
				operation: 'code_exchange',
				codeLength: code.length,
			})

			return tokenSet
		} catch (error) {
			// Trace the error
			if (this.config.traceOperations) {
				this.tracer.recordTokenValidation(
					false,
					{ accessToken: '' },
					`Code exchange failed: ${error instanceof Error ? error.message : String(error)}`,
				)
			}

			throw this.enhanceError(
				error,
				'Failed to exchange authorization code for tokens',
				TokenErrorCode.AUTHORIZATION_ERROR,
			)
		}
	}

	/**
	 * Get the current token data
	 */
	async getTokenData(): Promise<TokenData | null> {
		// If we're reconnecting, wait for reconnection to complete
		if (this.isReconnecting) {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] Waiting for reconnection to complete before getTokenData',
				)
			}
			await this.waitForReconnection()
		}

		// Try to get token data from the current token set first
		let tokenData = this.tokenSet ? this.mapTokenSet(this.tokenSet) : null

		// If no token data, try to load from persistence
		if (!tokenData) {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] No active tokens, attempting to load from storage',
				)
			}

			// Load tokens from persistence
			const loadedTokens = await this.loadTokens()

			if (loadedTokens) {
				if (this.config.debug) {
					console.debug('[EnhancedTokenManager] Loaded tokens from storage', {
						hasAccessToken: !!loadedTokens.accessToken,
						hasRefreshToken: !!loadedTokens.refreshToken,
						expiresAt: loadedTokens.expiresAt
							? new Date(loadedTokens.expiresAt).toISOString()
							: 'unknown',
					})
				}

				// Convert loaded tokens to an internal token set
				const expiresIn = loadedTokens.expiresAt
					? Math.max(
							0,
							Math.floor((loadedTokens.expiresAt - Date.now()) / 1000),
						)
					: 0

				this.tokenSet = this.createTokenResponse({
					access_token: loadedTokens.accessToken,
					refresh_token: loadedTokens.refreshToken,
					expires_in: expiresIn,
					token_type: 'Bearer',
				})

				// Preemptively refresh if tokens are expired or will expire soon
				if (this.shouldRefreshToken(loadedTokens)) {
					if (this.config.debug) {
						console.debug(
							'[EnhancedTokenManager] Loaded tokens need refresh, attempting refresh',
						)
					}

					try {
						// Attempt refresh with explicit token
						const refreshResult = await this.refreshWithRetry({
							force: true,
							refreshToken: loadedTokens.refreshToken,
						})

						// Ensure result conforms to TokenSet interface
						tokenData = {
							accessToken: refreshResult.accessToken,
							refreshToken: refreshResult.refreshToken || '',
							expiresAt: refreshResult.expiresAt || Date.now() + 3600 * 1000,
						}
					} catch (error) {
						console.warn(
							'[EnhancedTokenManager] Failed to refresh loaded tokens',
							error,
						)

						// Fall back to the loaded tokens even if refresh failed
						// This gives the user a chance to use the tokens if they're still valid
						// Ensure we have required fields for TokenSet
						tokenData = {
							accessToken: loadedTokens.accessToken,
							refreshToken: loadedTokens.refreshToken || '',
							expiresAt: loadedTokens.expiresAt || Date.now() + 3600 * 1000,
						}
					}
				} else {
					// Use loaded tokens as-is, ensuring we have required fields for TokenSet
					tokenData = {
						accessToken: loadedTokens.accessToken,
						refreshToken: loadedTokens.refreshToken || '',
						expiresAt: loadedTokens.expiresAt || Date.now() + 3600 * 1000,
					}
				}
			}
		}

		return tokenData
	}

	/**
	 * Get the current access token
	 */
	async getAccessToken(): Promise<string | null> {
		const tokenData = await this.getTokenData()
		return tokenData?.accessToken ?? null
	}

	/**
	 * Check if this manager supports token refresh
	 */
	supportsRefresh(): boolean {
		return true
	}

	/**
	 * Register a callback for token refresh events
	 */
	onRefresh(callback: (tokenData: TokenSet) => void): void {
		this.refreshCallbacks.push(callback)
	}

	/**
	 * Register a handler for reconnection events
	 */
	onReconnection(handler: () => Promise<void>): void {
		this.reconnectionHandlers.push(handler)
	}

	/**
	 * Refresh the token if needed
	 */
	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		// If a refresh is already in progress, wait for it to complete
		if (this.refreshLock) {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] Refresh already in progress, waiting for it to complete',
				)
			}
			return this.refreshLock
		}

		try {
			// Get current token data
			const currentTokens = await this.getTokenData()

			// Check if refresh is needed
			const needsRefresh =
				options?.force || this.shouldRefreshToken(currentTokens)

			if (needsRefresh) {
				if (this.config.debug) {
					console.debug('[EnhancedTokenManager] Token needs refresh', {
						force: options?.force,
						hasCurrentTokens: !!currentTokens,
						expiresAt: currentTokens?.expiresAt
							? new Date(currentTokens.expiresAt).toISOString()
							: 'unknown',
					})
				}

				// Start refresh with retry logic
				return this.refreshWithRetry(options)
			}

			// Return current tokens if no refresh is needed
			return currentTokens!
		} catch (error) {
			throw this.enhanceError(
				error,
				'Error checking if token needs refresh',
				TokenErrorCode.REFRESH_FAILED,
			)
		}
	}

	/**
	 * Refresh tokens using a specific refresh token
	 */
	async refresh(
		refreshToken: string,
		options?: { force?: boolean },
	): Promise<TokenSet> {
		const result = await this.refreshWithRetry({
			refreshToken,
			force: options?.force,
		})

		// Create a TokenSet to satisfy the FullAuthClient interface
		return {
			accessToken: result.accessToken,
			refreshToken: result.refreshToken || '', // Ensure it's never undefined
			expiresAt: result.expiresAt || Date.now() + 3600 * 1000, // Default to 1 hour if not specified
		}
	}

	/**
	 * Force a reconnection operation
	 * This is useful after a service restart or when tokens might be out of sync
	 */
	async reconnect(): Promise<boolean> {
		if (this.isReconnecting) {
			if (this.config.debug) {
				console.debug('[EnhancedTokenManager] Reconnection already in progress')
			}
			await this.waitForReconnection()
			return true
		}

		this.isReconnecting = true

		try {
			if (this.config.debug) {
				console.debug('[EnhancedTokenManager] Starting reconnection process')
			}

			// Run all reconnection handlers
			for (const handler of this.reconnectionHandlers) {
				try {
					await handler()
				} catch (error) {
					console.warn(
						'[EnhancedTokenManager] Reconnection handler failed',
						error,
					)
				}
			}

			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] Reconnection process completed successfully',
				)
			}

			return true
		} catch (error) {
			console.error('[EnhancedTokenManager] Reconnection process failed', error)
			return false
		} finally {
			this.isReconnecting = false
		}
	}

	/**
	 * Validate token format and integrity
	 *
	 * @param tokenData TokenData object to validate
	 * @param options Optional validation options
	 * @returns Validation result with details
	 */
	validateToken(
		tokenData: TokenData | null | undefined,
		options?: {
			minAccessTokenLength?: number
			minRefreshTokenLength?: number
			validateFormat?: boolean
			expiringThresholdSeconds?: number
		},
	): {
		valid: boolean
		reason?: string
		canRefresh?: boolean
		isExpiring?: boolean
		expiresInSeconds?: number
		format?: {
			isValid: boolean
			issues?: string[]
		}
	} {
		// Default options
		const {
			minAccessTokenLength = 20,
			minRefreshTokenLength = 20,
			validateFormat = true,
			expiringThresholdSeconds = 300, // 5 minutes
		} = options || {}

		// Basic validation
		if (!tokenData) {
			return { valid: false, reason: 'Token data is undefined or null' }
		}

		if (!tokenData.accessToken) {
			return { valid: false, reason: 'Access token is missing' }
		}

		// Check if the token has refresh capability
		const canRefresh = !!tokenData.refreshToken

		// Validate format if requested
		let formatIssues: string[] = []
		if (validateFormat) {
			// Access token format checks
			if (tokenData.accessToken.length < minAccessTokenLength) {
				formatIssues.push(
					`Access token length (${tokenData.accessToken.length}) is less than minimum expected (${minAccessTokenLength})`,
				)
			}

			if (tokenData.accessToken.includes(' ')) {
				formatIssues.push('Access token contains spaces')
			}

			// Refresh token format checks (if present)
			if (tokenData.refreshToken) {
				if (tokenData.refreshToken.length < minRefreshTokenLength) {
					formatIssues.push(
						`Refresh token length (${tokenData.refreshToken.length}) is less than minimum expected (${minRefreshTokenLength})`,
					)
				}

				if (tokenData.refreshToken.includes(' ')) {
					formatIssues.push('Refresh token contains spaces')
				}
			}
		}

		// Check for token expiration
		if (tokenData.expiresAt !== undefined) {
			const now = Date.now()
			const expiresInMs = tokenData.expiresAt - now
			const expiresInSeconds = Math.floor(expiresInMs / 1000)

			// If token is already expired
			if (expiresInMs <= 0) {
				return {
					valid: false,
					reason: `Token expired ${Math.abs(expiresInSeconds)} seconds ago`,
					expiresInSeconds,
					canRefresh,
					format: {
						isValid: formatIssues.length === 0,
						issues: formatIssues.length > 0 ? formatIssues : undefined,
					},
				}
			}

			// If token is close to expiry
			const isExpiring = expiresInMs <= expiringThresholdSeconds * 1000

			// Validate refresh token if present
			if (tokenData.refreshToken) {
				const refreshTokenValidation = this.validateRefreshToken(
					tokenData.refreshToken,
				)

				if (!refreshTokenValidation.valid) {
					return {
						valid: false,
						reason: `Invalid refresh token: ${refreshTokenValidation.reason}`,
						canRefresh: false,
						isExpiring,
						expiresInSeconds,
						format: {
							isValid: formatIssues.length === 0,
							issues: formatIssues.length > 0 ? formatIssues : undefined,
						},
					}
				}
			}

			// Token is valid with potential format issues and expiration info
			return {
				valid: true,
				canRefresh,
				isExpiring,
				expiresInSeconds,
				format: {
					isValid: formatIssues.length === 0,
					issues: formatIssues.length > 0 ? formatIssues : undefined,
				},
			}
		}

		// Validate refresh token if present
		if (tokenData.refreshToken) {
			const refreshTokenValidation = this.validateRefreshToken(
				tokenData.refreshToken,
			)

			if (!refreshTokenValidation.valid) {
				return {
					valid: false,
					reason: `Invalid refresh token: ${refreshTokenValidation.reason}`,
					canRefresh: false,
					format: {
						isValid: formatIssues.length === 0,
						issues: formatIssues.length > 0 ? formatIssues : undefined,
					},
				}
			}
		}

		// No expiration time but token exists - technically valid but risky
		return {
			valid: true,
			canRefresh,
			reason:
				'No expiration time provided, token validity cannot be determined',
			format: {
				isValid: formatIssues.length === 0,
				issues: formatIssues.length > 0 ? formatIssues : undefined,
			},
		}
	}

	/**
	 * Validates a token for a specific URL or API endpoint
	 * This can be used to check if a token is valid for a specific API operation
	 *
	 * @param tokenData TokenData object to validate
	 * @param targetUrl The URL or API endpoint to validate for
	 * @param options Validation options
	 * @returns Validation result with details
	 */
	validateTokenForEndpoint(
		tokenData: TokenData | null | undefined,
		targetUrl: string,
		options?: {
			minAccessTokenLength?: number
			minRefreshTokenLength?: number
			validateFormat?: boolean
			expiringThresholdSeconds?: number
		},
	): {
		valid: boolean
		reason?: string
		canRefresh?: boolean
		isExpiring?: boolean
		expiresInSeconds?: number
		format?: {
			isValid: boolean
			issues?: string[]
		}
	} {
		// First perform basic token validation
		const baseValidation = this.validateToken(tokenData, options)

		// If the base validation already failed, return that result
		if (!baseValidation.valid) {
			return baseValidation
		}

		// Check if the URL is for the Schwab API
		if (
			targetUrl.includes('schwab.com/api') ||
			targetUrl.includes('schwabapi.com') ||
			targetUrl.includes('td.com/api')
		) {
			// Additional checks specific to Schwab API could be added here
			// For example, checking for specific scopes or permissions

			return baseValidation
		}

		// For token endpoint itself, validate refresh token
		if (targetUrl.includes('/token') || targetUrl.includes('/oauth2')) {
			if (!tokenData?.refreshToken) {
				return {
					valid: false,
					reason: 'Missing refresh token for token refresh operation',
					format: baseValidation.format,
				}
			}

			// Token is valid for the endpoint
			return baseValidation
		}

		// For other URLs, use the base validation
		return baseValidation
	}

	/**
	 * Creates a proper Authorization header value from token data
	 *
	 * @param tokenData TokenData object containing the access token
	 * @returns Authorization header value or null if no valid token is available
	 */
	createAuthHeaderFromToken(
		tokenData: TokenData | null | undefined,
	): string | null {
		if (!tokenData?.accessToken) {
			return null
		}

		// Ensure the token doesn't already include 'Bearer'
		const token = tokenData.accessToken.startsWith('Bearer ')
			? tokenData.accessToken
			: `Bearer ${tokenData.accessToken}`

		return token
	}

	/**
	 * Checks if the Authorization header is properly formatted
	 *
	 * @param headerValue The Authorization header value to check
	 * @returns Validation result
	 */
	validateAuthorizationHeader(headerValue: string | null | undefined): {
		isValid: boolean
		reason?: string
		formattedValue?: string
	} {
		// Check for missing header
		if (!headerValue) {
			return {
				isValid: false,
				reason: 'Missing Authorization header',
			}
		}

		// Check for Bearer prefix
		if (!headerValue.startsWith('Bearer ')) {
			// Try to fix by adding Bearer prefix
			const formattedValue = `Bearer ${headerValue}`

			return {
				isValid: false,
				reason: 'Authorization header missing "Bearer" prefix',
				formattedValue,
			}
		}

		// Check for token after prefix
		const parts = headerValue.split(' ')
		if (parts.length < 2 || !parts[1]) {
			return {
				isValid: false,
				reason: 'Authorization header missing token',
			}
		}

		// Check for extra spaces
		if (parts.length > 2) {
			// Try to fix by removing extra spaces
			const formattedValue = `Bearer ${parts[1]}`

			return {
				isValid: false,
				reason: 'Authorization header contains extra spaces',
				formattedValue,
			}
		}

		// Valid header
		return {
			isValid: true,
		}
	}

	/**
	 * Clear all token data and state
	 * Useful for logout or when tokens need to be completely reset
	 */
	async clearTokens(): Promise<void> {
		// Clear persistence state
		this.clearTokenState()

		// Clear the token set
		this.tokenSet = undefined

		// Record the operation if tracing is enabled
		if (this.config.traceOperations) {
			this.tracer.recordTokenSave(true)
		}

		if (this.config.debug) {
			console.debug('[EnhancedTokenManager] All tokens cleared')
		}
	}

	/**
	 * Log a debug message if debug mode is enabled for persistence operations
	 */
	private logDebug(message: string, data?: Record<string, any>): void {
		if (this.persistenceDebugEnabled) {
			console.debug(`[EnhancedTokenManager:Persistence] ${message}`, data)
		}
	}

	/**
	 * Trigger a persistence event with the provided data
	 */
	private triggerEvent(
		event: TokenPersistenceEvent,
		data: TokenData,
		metadata?: Record<string, any>,
	): void {
		if (this.persistenceEventHandler) {
			try {
				this.persistenceEventHandler(event, data, metadata)
			} catch (error) {
				this.logDebug('Error in event handler', {
					event,
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}
	}

	/**
	 * Register an event handler for token persistence lifecycle events
	 */
	onPersistenceEvent(handler: TokenPersistenceEventHandler): void {
		this.persistenceEventHandler = handler
	}

	/**
	 * Save tokens to storage and trigger appropriate events
	 *
	 * @param tokens - The tokens to save
	 * @param metadata - Additional metadata to include with the event
	 * @returns - True if tokens were saved successfully, false otherwise
	 */
	async saveTokens(
		tokens: TokenData,
		metadata?: Record<string, any>,
	): Promise<boolean> {
		if (!this.saveFn) {
			this.logDebug('No save function provided, skipping token save')
			return false
		}

		// Validate tokens before saving
		if (!this.validateTokensBeforeSaving(tokens)) {
			this.logDebug('Invalid tokens, not saving', {
				hasAccessToken: !!tokens.accessToken,
				hasRefreshToken: !!tokens.refreshToken,
			})
			return false
		}

		// Create a tokenSet for storage
		const tokenSet: TokenSet = {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken || '',
			expiresAt: tokens.expiresAt || Date.now() + 3600 * 1000, // Default to 1 hour if not specified
		}

		try {
			// Save tokens
			await this.saveFn(tokenSet)

			// Store a copy of the saved tokens
			this.lastSavedTokens = { ...tokens }

			// Trigger success event
			this.triggerEvent(TokenPersistenceEvent.TOKEN_SAVED, tokens, metadata)

			this.logDebug('Tokens saved successfully', {
				hasAccessToken: !!tokens.accessToken,
				accessTokenLength: tokens.accessToken?.length,
				hasRefreshToken: !!tokens.refreshToken,
				refreshTokenLength: tokens.refreshToken?.length,
				tokenExpiresAt: tokens.expiresAt
					? new Date(tokens.expiresAt).toISOString()
					: 'unknown',
			})

			return true
		} catch (error) {
			// Trigger failure event
			this.triggerEvent(TokenPersistenceEvent.TOKEN_SAVE_FAILED, tokens, {
				...metadata,
				error: error instanceof Error ? error.message : String(error),
			})

			this.logDebug('Failed to save tokens', {
				error: error instanceof Error ? error.message : String(error),
			})

			return false
		}
	}

	/**
	 * Load tokens from storage and trigger appropriate events
	 *
	 * @param metadata - Additional metadata to include with the event
	 * @returns - The loaded tokens or null if no tokens were loaded
	 */
	async loadTokens(metadata?: Record<string, any>): Promise<TokenData | null> {
		if (!this.loadFn) {
			this.logDebug('No load function provided, skipping token load')
			return null
		}

		try {
			// Load tokens
			const tokenSet = await this.loadFn()

			if (!tokenSet) {
				this.logDebug('No tokens found in storage')
				return null
			}

			// Create a TokenData object
			const tokenData: TokenData = {
				accessToken: tokenSet.accessToken,
				refreshToken: tokenSet.refreshToken,
				expiresAt: tokenSet.expiresAt,
			}

			// Validate loaded tokens if enabled
			if (this.validateOnLoad && !this.validateLoadedTokens(tokenData)) {
				this.triggerEvent(
					TokenPersistenceEvent.TOKEN_VALIDATION_FAILED,
					tokenData,
					{
						...metadata,
						reason: 'Invalid token format or missing required fields',
					},
				)
				return null
			}

			// Store a copy of the loaded tokens
			this.lastLoadedTokens = { ...tokenData }

			// Trigger success event
			this.triggerEvent(TokenPersistenceEvent.TOKEN_LOADED, tokenData, metadata)

			this.logDebug('Tokens loaded successfully', {
				hasAccessToken: !!tokenData.accessToken,
				accessTokenLength: tokenData.accessToken?.length,
				hasRefreshToken: !!tokenData.refreshToken,
				refreshTokenLength: tokenData.refreshToken?.length,
				tokenExpiresAt: tokenData.expiresAt
					? new Date(tokenData.expiresAt).toISOString()
					: 'unknown',
			})

			return tokenData
		} catch (error) {
			// Trigger failure event
			this.triggerEvent(
				TokenPersistenceEvent.TOKEN_LOAD_FAILED,
				{ accessToken: '', refreshToken: '', expiresAt: 0 },
				{
					...metadata,
					error: error instanceof Error ? error.message : String(error),
				},
			)

			this.logDebug('Failed to load tokens', {
				error: error instanceof Error ? error.message : String(error),
			})

			return null
		}
	}

	/**
	 * Validate tokens before saving
	 *
	 * @param tokens - The tokens to validate
	 * @returns - True if tokens are valid, false otherwise
	 */
	private validateTokensBeforeSaving(tokens: TokenData): boolean {
		// Basic validation - must have an access token at minimum
		if (!tokens.accessToken) {
			this.logDebug('Access token is missing or empty')
			return false
		}

		return true
	}

	/**
	 * Validate loaded tokens
	 *
	 * @param tokens - The tokens to validate
	 * @returns - True if tokens are valid, false otherwise
	 */
	private validateLoadedTokens(tokens: TokenData): boolean {
		// Must have an access token
		if (!tokens.accessToken) {
			this.logDebug('Loaded access token is missing or empty')
			return false
		}

		// If expiry time is provided, check if it's valid
		if (tokens.expiresAt) {
			const now = Date.now()

			// If the expiry time is more than 24 hours in the past, it's likely invalid
			if (tokens.expiresAt < now - 24 * 60 * 60 * 1000) {
				this.logDebug('Loaded token has expired too long ago', {
					expiresAt: new Date(tokens.expiresAt).toISOString(),
					now: new Date(now).toISOString(),
					diffHours: (now - tokens.expiresAt) / (1000 * 60 * 60),
				})
				return false
			}
		}

		return true
	}

	/**
	 * Get the last successfully saved tokens
	 */
	getLastSavedTokens(): TokenData | undefined {
		return this.lastSavedTokens ? { ...this.lastSavedTokens } : undefined
	}

	/**
	 * Get the last successfully loaded tokens
	 */
	getLastLoadedTokens(): TokenData | undefined {
		return this.lastLoadedTokens ? { ...this.lastLoadedTokens } : undefined
	}

	/**
	 * Clear all token state
	 */
	clearTokenState(): void {
		this.lastSavedTokens = undefined
		this.lastLoadedTokens = undefined
	}

	/**
	 * Check if a token can be refreshed
	 *
	 * @param refreshToken - The refresh token to validate
	 * @returns - Object containing validation result and reason
	 */
	validateRefreshToken(refreshToken?: string): {
		valid: boolean
		reason?: string
	} {
		if (!refreshToken) {
			return {
				valid: false,
				reason: 'Refresh token is empty or undefined',
			}
		}

		// Check for suspiciously short tokens
		if (refreshToken.length < 20) {
			return {
				valid: false,
				reason: 'Refresh token is too short to be valid',
			}
		}

		// Schwab refresh tokens may have special format requirements
		// Don't perform strict format validation as tokens can vary by provider
		// This is a more permissive validation approach

		// Ensure token doesn't contain problematic characters that might cause issues in requests
		if (
			refreshToken.includes(' ') ||
			refreshToken.includes('\t') ||
			refreshToken.includes('\n')
		) {
			return {
				valid: false,
				reason: 'Refresh token contains whitespace characters',
			}
		}

		// Check if token has proper encoding (should be URL-safe)
		try {
			// Try to detect obviously malformed tokens
			const decoded = decodeURIComponent(refreshToken)
			if (
				decoded !== refreshToken &&
				!refreshToken.match(/^[A-Za-z0-9\-_.~%]+$/)
			) {
				// If token was modified by decoding and doesn't match URL-safe pattern
				// it might need URL encoding before sending
				if (this.config.debug) {
					console.debug(
						'[EnhancedTokenManager] Refresh token may need URL encoding',
					)
				}
			}
		} catch (e) {
			// If decoding fails, the token likely contains invalid URL characters
			console.error('Error decoding refresh token', e)
			return {
				valid: false,
				reason: 'Refresh token contains invalid characters',
			}
		}

		return { valid: true }
	}

	/**
	 * Generate a detailed report of the token state
	 * Useful for debugging token issues
	 */
	async generateTokenReport(): Promise<{
		currentTokens: TokenData | null
		lastSavedTokens: TokenData | undefined
		lastLoadedTokens: TokenData | undefined
		tokenValidation: {
			valid: boolean
			reason?: string
			canRefresh?: boolean
		} | null
		refreshHistory: any // Using any to avoid TypeScript error
	}> {
		// Get current token state
		const currentTokens = await this.getTokenData()

		// Get token validation if tokens exist
		const tokenValidation = currentTokens
			? this.validateToken(currentTokens)
			: null

		return {
			currentTokens,
			lastSavedTokens: this.getLastSavedTokens(),
			lastLoadedTokens: this.getLastLoadedTokens(),
			tokenValidation,
			refreshHistory: this.tracer.getLatestRefreshReport(),
		}
	}

	/**
	 * Creates a token response that satisfies the TokenEndpointResponseHelpers interface
	 */
	private createTokenResponse(data: {
		access_token: string
		refresh_token?: string
		expires_in: number
		token_type: string
		scope?: string
	}): oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers {
		return {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
			scope: data.scope,
			// Helper methods required by TokenEndpointResponseHelpers
			claims: () => undefined,
			expiresIn: () => data.expires_in,
		} as oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers
	}

	/**
	 * Maps a TokenEndpointResponse to our TokenSet interface
	 */
	private mapTokenSet(ts: oidc.TokenEndpointResponse): TokenSet {
		return {
			accessToken: ts.access_token!,
			refreshToken: ts.refresh_token ?? '',
			expiresAt: ts.expires_in ? Date.now() + ts.expires_in * 1000 : Date.now(),
		}
	}

	/**
	 * Makes a direct token request to the token endpoint
	 * This approach works across all environments including Cloudflare Workers
	 */
	private async makeTokenRequest(
		tokenEndpoint: string,
		params: Record<string, string>,
		clientId: string,
		clientSecret: string,
	): Promise<oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers> {
		// Special handling for Schwab refresh tokens
		if (params.grant_type === 'refresh_token' && params.refresh_token) {
			// Ensure refresh token is properly formatted
			// Schwab refresh tokens may need special handling
			const refreshToken = params.refresh_token

			// Log the token format without revealing the actual token
			if (this.config.debug) {
				console.debug('[EnhancedTokenManager] Token refresh request:', {
					tokenEndpoint,
					refreshTokenLength: refreshToken.length,
					refreshTokenStart: refreshToken.substring(0, 4) + '...',
					refreshTokenEnd:
						'...' + refreshToken.substring(refreshToken.length - 4),
					hasSpecialChars: Boolean(refreshToken.match(/[^A-Za-z0-9\-_.]/)),
				})
			}

			// Use encodeURIComponent to ensure URL-safe format for the token
			// This is particularly important for tokens with special characters
			params.refresh_token = encodeURIComponent(refreshToken)
		}

		// Create URLSearchParams from the parameters
		const urlParams = new URLSearchParams(params)

		// Create proper Basic Auth header value that works in all environments
		let authValue: string
		try {
			// For browser/Cloudflare environment
			authValue = btoa(`${clientId}:${clientSecret}`)
		} catch (e) {
			// For Node.js environment
			authValue = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
			if (this.config.debug) {
				console.debug('Using Node.js Buffer for Basic Auth encoding')
			}
			console.error('Error encoding Basic Auth:', e)
		}

		// Prepare request headers with special consideration for token requests
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			Authorization: `Basic ${authValue}`,
		}

		// Add additional headers that might be needed for Schwab API
		if (tokenEndpoint.includes('schwab') || tokenEndpoint.includes('td.com')) {
			// Some APIs require specific headers for refresh token requests
			headers['X-Request-ID'] =
				`refresh-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
		}

		// Make the direct fetch request with improved error handling
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: urlParams,
			// Add reasonable timeout to prevent hanging requests
			signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined, // 30 second timeout if supported
		})

		if (!response.ok) {
			const errorText = await response.text()

			// Extract more detailed error information if possible
			let errorDetails = {}
			try {
				// Try to parse error as JSON
				errorDetails = JSON.parse(errorText)
			} catch (e) {
				// Not valid JSON, use as-is
				errorDetails = { error: errorText }
				if (this.config.debug) {
					console.debug('Error parsing error text', e)
				}
			}

			// Log detailed error information
			if (this.config.debug) {
				console.error('[ERROR] Token request failed', {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
					requestUrl: tokenEndpoint,
					requestMethod: 'POST',
					grantType: params.grant_type,
					hasCode: !!params.code,
					codeLength: params.code ? params.code.length : 0,
					redirectUri: params.redirect_uri,
				})
			}

			// Create a more descriptive error
			const errorObj = new Error(
				`Token request failed: ${response.status} ${response.statusText} - ${errorText}`,
			)
			;(errorObj as any).status = response.status
			;(errorObj as any).statusText = response.statusText
			;(errorObj as any).responseBody = errorText
			;(errorObj as any).details = errorDetails
			throw errorObj
		}

		// Parse the response
		const responseData = await response.json()

		// Create a token response object that satisfies the TokenEndpointResponseHelpers interface
		return this.createTokenResponse(responseData)
	}

	/**
	 * Private method to handle auto-reconnection
	 */
	private async handleAutoReconnect(): Promise<void> {
		if (this.config.debug) {
			console.debug('[EnhancedTokenManager] Handling auto-reconnection')
		}

		// Load tokens from storage
		const loadedTokens = await this.loadTokens({
			operation: 'auto_reconnect',
		})

		if (!loadedTokens) {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] No tokens found during auto-reconnect',
				)
			}
			return
		}

		// Force refresh tokens if they exist
		if (loadedTokens.refreshToken) {
			try {
				if (this.config.debug) {
					console.debug(
						'[EnhancedTokenManager] Forcing token refresh during auto-reconnect',
					)
				}

				await this.refresh(loadedTokens.refreshToken, { force: true })

				if (this.config.debug) {
					console.debug(
						'[EnhancedTokenManager] Auto-reconnect refresh successful',
					)
				}
			} catch (error) {
				console.warn(
					'[EnhancedTokenManager] Auto-reconnect refresh failed',
					error,
				)
			}
		} else {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] No refresh token available during auto-reconnect',
				)
			}
		}
	}

	/**
	 * Private method to check if a token is expired or will expire soon
	 */
	private isTokenExpired(tokenData?: TokenData | null): boolean {
		if (!tokenData || !tokenData.expiresAt) {
			return true
		}

		return tokenData.expiresAt <= Date.now()
	}

	/**
	 * Private method to check if a token should be refreshed
	 */
	private shouldRefreshToken(tokenData?: TokenData | null): boolean {
		if (!tokenData || !tokenData.expiresAt) {
			return true
		}

		// Check if token is expired or will expire soon using our utility method
		return this.tokenIsExpiringSoon(
			tokenData.expiresAt,
			this.config.refreshThresholdMs,
		)
	}

	/**
	 * Private method to enhance error objects with more context
	 */
	private enhanceError(
		error: unknown,
		message: string,
		code: TokenErrorCode,
	): SchwabAuthError {
		if (error instanceof SchwabAuthError) {
			return error
		}

		const context: Record<string, any> = {
			originalError: error,
		}

		if (error instanceof Error) {
			context.originalMessage = error.message
			context.originalStack = error.stack
		}

		// Using string code to avoid enum compatibility issues
		return new SchwabAuthError(
			code as any, // Use type assertion
			message,
			undefined, // Don't pass status which is the third parameter
			context, // Pass context as the body (4th parameter)
		)
	}

	/**
	 * Private method to calculate retry delay with exponential backoff
	 */
	private calculateRetryDelay(attempt: number): number {
		if (!this.config.useExponentialBackoff) {
			return this.config.initialRetryDelayMs
		}

		// Exponential backoff: initialDelay * 2^attempt
		const delay = this.config.initialRetryDelayMs * Math.pow(2, attempt)

		// Ensure delay doesn't exceed maximum
		return Math.min(delay, this.config.maxRetryDelayMs)
	}

	/**
	 * Private method to wait for an active reconnection to complete
	 */
	private async waitForReconnection(): Promise<void> {
		if (!this.isReconnecting) {
			return
		}

		// Simple polling mechanism to wait for reconnection to complete
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (!this.isReconnecting) {
					clearInterval(checkInterval)
					resolve()
				}
			}, 100)
		})
	}

	/**
	 * Private method to refresh tokens with retry logic
	 */
	private async refreshWithRetry(options?: RefreshOptions): Promise<TokenData> {
		// Create a lock to prevent concurrent refreshes
		const refreshPromise = (async () => {
			// Record refresh timestamp
			this.lastRefreshAttempt = Date.now()

			let refreshToken = options?.refreshToken

			if (!refreshToken) {
				// Get current tokens if no refresh token was provided
				const currentTokens = this.tokenSet
					? this.mapTokenSet(this.tokenSet)
					: null

				// Use refresh token from current tokens
				refreshToken = currentTokens?.refreshToken

				// If still no refresh token, try to load from persistence
				if (!refreshToken) {
					const loadedTokens = await this.loadTokens({
						operation: 'refresh_fallback',
					})
					refreshToken = loadedTokens?.refreshToken
				}
			}

			if (!refreshToken) {
				throw new SchwabAuthError(
					'REFRESH_NEEDED' as any, // Use type assertion
					'No refresh token available for token refresh',
				)
			}

			// Validate refresh token before attempting refresh
			if (this.config.validateTokens) {
				const validation = this.validateRefreshToken(refreshToken)
				if (!validation.valid) {
					throw new SchwabAuthError(
						'INVALID_CODE' as any, // Use type assertion
						`Invalid refresh token: ${validation.reason}`,
					)
				}
			}

			// Start tracing if enabled
			const refreshId = this.config.traceOperations
				? this.tracer.startRefreshTrace()
				: null

			// Implement retry logic with exponential backoff
			let attempt = 0
			let attemptsMade = 0
			let lastError: unknown = null

			while (attempt < this.config.maxRetryAttempts) {
				try {
					if (attempt > 0 && this.config.debug) {
						console.debug(
							`[EnhancedTokenManager] Retry attempt ${attempt + 1}/${this.config.maxRetryAttempts}`,
						)
					}

					// Get token endpoint and credentials
					const tokenEndpoint = this.oidcConfig.serverMetadata().token_endpoint!
					const clientId = this.oidcConfig.clientMetadata().client_id
					const clientSecret = this.oidcConfig.clientMetadata()
						.client_secret as string

					// Make direct token request
					const tokenData = await this.makeTokenRequest(
						tokenEndpoint,
						{
							grant_type: 'refresh_token',
							refresh_token: refreshToken,
						},
						clientId,
						clientSecret,
					)

					// Store the new token set
					this.tokenSet = tokenData

					// Convert to TokenSet format
					const tokenSet = this.mapTokenSet(tokenData)

					// Record success if tracing is enabled
					if (this.config.traceOperations) {
						this.tracer.recordRefreshSuccess(refreshId, tokenSet)
					}

					// Save tokens to persistence
					await this.saveTokens(tokenSet, {
						operation: 'refresh',
						attempt: attemptsMade + 1,
						success: true,
					})

					// Notify refresh callbacks
					this.refreshCallbacks.forEach((callback) => {
						try {
							callback(tokenSet)
						} catch (callbackError) {
							console.warn(
								'[EnhancedTokenManager] Refresh callback error',
								callbackError,
							)
						}
					})

					if (this.config.debug) {
						console.debug('[EnhancedTokenManager] Token refresh successful', {
							hasAccessToken: !!tokenSet.accessToken,
							hasRefreshToken: !!tokenSet.refreshToken,
							expiresAt: tokenSet.expiresAt
								? new Date(tokenSet.expiresAt).toISOString()
								: 'unknown',
						})
					}

					return tokenSet
				} catch (error) {
					lastError = error
					attemptsMade++

					// Record failure if tracing is enabled
					if (this.config.traceOperations) {
						this.tracer.recordRefreshFailure(refreshId, error)
					}

					// Check if this error is retryable
					const shouldRetry = this.isRetryableError(error)

					if (!shouldRetry) {
						if (this.config.debug) {
							console.debug(
								'[EnhancedTokenManager] Non-retryable error during refresh',
								{
									error: error instanceof Error ? error.message : String(error),
									attempt: attemptsMade,
								},
							)
						}
						break
					}

					attempt++

					if (attempt < this.config.maxRetryAttempts) {
						// Calculate delay for next retry
						const delay = this.calculateRetryDelay(attempt)

						if (this.config.debug) {
							console.debug(
								`[EnhancedTokenManager] Waiting ${delay}ms before retry ${attempt + 1}/${this.config.maxRetryAttempts}`,
							)
						}

						// Wait before next attempt
						await new Promise((resolve) => setTimeout(resolve, delay))
					}
				}
			}

			// If we get here, all retry attempts failed
			const errorMessage =
				lastError instanceof Error ? lastError.message : String(lastError)

			throw this.enhanceError(
				lastError,
				`Token refresh failed after ${attemptsMade} attempts: ${errorMessage}`,
				TokenErrorCode.REFRESH_FAILED,
			)
		})()

		// Set the refresh lock
		this.refreshLock = refreshPromise

		try {
			// Wait for the refresh to complete
			return await refreshPromise
		} finally {
			// Clear the refresh lock when done
			if (this.refreshLock === refreshPromise) {
				this.refreshLock = null
			}
		}
	}

	/**
	 * Private method to determine if an error is retryable
	 */
	private isRetryableError(error: unknown): boolean {
		// Network errors are generally retryable
		if (error instanceof TypeError && error.message.includes('network')) {
			return true
		}

		// Extract error details for analysis
		const errorMessage = error instanceof Error ? error.message : String(error)
		const errorDetails = (error as any)?.details || {}
		const responseBody = (error as any)?.responseBody || ''

		// Check for specific error conditions that should NOT be retried
		if (
			errorMessage.includes('unsupported_token_type') ||
			responseBody.includes('unsupported_token_type') ||
			responseBody.includes('refresh_token_authentication_error')
		) {
			// These are token format/validation issues that won't be fixed by retrying
			if (this.config.debug) {
				console.debug('[EnhancedTokenManager] Non-retryable token error:', {
					message: errorMessage,
					details: JSON.stringify(errorDetails).substring(0, 100),
				})
			}
			return false
		}

		// Check for specific HTTP status codes that indicate retryable errors
		if (error instanceof Error) {
			const status = (error as any).status

			if (status) {
				// Don't retry 400 errors with specific token issues
				if (
					status === 400 &&
					(errorMessage.includes('token') || responseBody.includes('token'))
				) {
					return false
				}

				// Retry server errors (500s) and some specific client errors
				return (
					(status >= 500 && status < 600) || // Server errors
					status === 429 || // Too many requests
					status === 408 || // Request timeout
					status === 503 // Service unavailable
				)
			}
		}

		// Don't retry validation errors or expired tokens
		if (error instanceof SchwabAuthError) {
			// Check the error code as string to avoid enum compatibility issues
			const code = (error as any).code
			return (
				code !== 'INVALID_CODE' &&
				code !== TokenErrorCode.AUTHORIZATION_ERROR &&
				!errorMessage.includes('refresh token')
			)
		}

		// For Schwab specific API errors (using string checks as we don't have type info)
		if (
			typeof errorMessage === 'string' &&
			(errorMessage.includes('authentication_error') ||
				errorMessage.includes('invalid_token') ||
				errorMessage.includes('unsupported_token_type'))
		) {
			return false
		}

		// Default to allowing retry for unknown errors, but log them
		if (this.config.debug) {
			console.debug(
				'[EnhancedTokenManager] Allowing retry for unknown error type:',
				{
					errorType:
						error instanceof Error ? error.constructor.name : typeof error,
					errorMessage:
						errorMessage.substring(0, 100) +
						(errorMessage.length > 100 ? '...' : ''),
				},
			)
		}
		return true
	}
}
