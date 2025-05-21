import * as oidc from 'openid-client'
import { API_URLS, API_VERSIONS } from '../constants'
import { SchwabAuthError, AuthErrorCode } from '../errors'
import {
	getAuthDiagnostics,
	type AuthDiagnosticsOptions,
	type AuthDiagnosticsResult,
} from './auth-diagnostics'
import { TokenRefreshTracer } from './token-refresh-tracer'
import {
	type TokenData,
	type TokenSet,
	type RefreshOptions,
	type AuthClientOptions,
	type FullAuthClient,
	type SchwabTokenResponse,
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
export const DEFAULT_REFRESH_THRESHOLD_MS = 300_000 // 5 minutes before expiration
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
	private tokenSet?: SchwabTokenResponse

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
				// No save function provided
				return
			})

		const dummyLoad =
			this.config.load ||
			(async () => {
				// No load function provided
				return null
			})

		// Create a wrapper for the token event handler
		this.persistenceEventHandler =
			this.config.onTokenEvent ||
			((_event, _data) => {
				// No event handler provided
				return
			})

		// Initialize persistence-related properties (integrated from TokenPersistenceManager)
		this.saveFn = dummySave
		this.loadFn = dummyLoad
		this.persistenceDebugEnabled = this.config.debug
		this.validateOnLoad = this.config.validateTokens

		// Get the token refresh tracer instance
		this.tracer = TokenRefreshTracer.getInstance({
			includeRawResponses: false,
		})

		// Log configuration for debugging
		if (this.config.debug) {
			// Debug log removed
		}
	}

	/**
	 * Get the authorization URL for the OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[]; state?: string }): {
		authUrl: string
	} {
		const scope = opts?.scope || this.config.scope
		const baseIssuerUrl = this.config.issuerBaseUrl

		const authParams: Record<string, string> = {
			client_id: this.config.clientId,
			scope: scope.join(' '),
			response_type: 'code',
			redirect_uri: this.config.redirectUri,
		}

		if (opts?.state) {
			authParams.state = opts.state
		}

		const authUrl = `${baseIssuerUrl}/oauth/authorize?${new URLSearchParams(authParams).toString()}`

		return { authUrl }
	}

	/**
	 * Exchange an authorization code for tokens
	 * This method is used after the user completes the authorization flow
	 */
	async exchangeCode(code: string): Promise<TokenSet> {
		// Handle exchange internally using direct token exchange
		try {
			// Prepare parameters for token exchange
			const params = {
				grant_type: 'authorization_code',
				code,
				redirect_uri: this.config.redirectUri,
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
			}

			// Extra logging for debugging
			if (this.config.debug) {
				// Info log removed
			}

			// Perform token exchange directly
			const tokenData = await this.performDirectTokenExchange(params)

			// Map the response to our TokenSet format
			const tokenSet: TokenSet = {
				accessToken: tokenData.access_token!,
				refreshToken: tokenData.refresh_token || '',
				expiresAt: Date.now() + (tokenData.expires_in || 0) * 1000,
			}

			// Store the tokens and persist them with metadata about the code exchange
			this.tokenSet = tokenData
			await this.persistTokens(tokenSet, {
				operation: 'code_exchange',
				codeLength: code.length,
				timestamp: Date.now(),
			})

			// Return the mapped tokens
			return tokenSet
		} catch (error) {
			// Handle exchange error
			throw this.formatTokenError(
				error,
				'Failed to exchange authorization code for tokens',
				AuthErrorCode.UNAUTHORIZED,
			)
		}
	}

	/**
	 * Implement the ITokenLifecycleManager interface
	 */

	/**
	 * Get the current token data
	 * Handles token loading and validation
	 */
	async getTokenData(): Promise<TokenData | null> {
		// Wait for any ongoing reconnection process to complete
		if (this.isReconnecting) {
			if (this.config.debug) {
				// Debug log removed
			}
			await this.waitForReconnection()
		}

		// If we have tokens already, use them
		if (this.tokenSet) {
			return this.mapToTokenData(this.tokenSet)
		}

		// If we don't have tokens and there's a load function, try to load from storage
		if (this.loadFn) {
			if (this.config.debug) {
				// Debug log removed
			}

			try {
				const loadedTokens = await this.loadTokensFromStorage()

				// If tokens were loaded, validate and potentially refresh them
				if (loadedTokens) {
					if (this.config.debug) {
						// Debug log removed
					}

					// Store the tokens in memory
					this.tokenSet = {
						access_token: loadedTokens.accessToken,
						refresh_token: loadedTokens.refreshToken,
						expires_in: 0, // Not used directly
						token_type: 'bearer',
					}

					// Check if the tokens need to be refreshed
					const shouldRefresh = this.shouldRefreshToken(loadedTokens.expiresAt)

					if (shouldRefresh && loadedTokens.refreshToken) {
						if (this.config.debug) {
							// Debug log removed
						}

						try {
							// Refresh the tokens since they're about to expire
							await this.refreshIfNeeded({
								refreshToken: loadedTokens.refreshToken,
								force: true,
							})

							// After refresh, get the updated tokens
							return this.mapToTokenData(this.tokenSet)
						} catch (e) {
							// Log the error but don't throw - return the current tokens if still valid
							if (this.config.debug) {
								// Warning log removed
							}

							// If the current tokens are still valid, use them
							if (
								loadedTokens.expiresAt &&
								loadedTokens.expiresAt > Date.now()
							) {
								return loadedTokens
							}

							console.error('No valid tokens available', e)

							// Otherwise, return null to indicate no valid tokens
							return null
						}
					}

					// If refresh not needed, return the loaded tokens
					return loadedTokens
				}
			} catch (error) {
				// Error loading tokens, return null
				console.error('Error loading tokens', error)
				return null
			}
		}

		// No tokens available
		return null
	}

	/**
	 * Get the access token only
	 */
	async getAccessToken(): Promise<string | null> {
		const tokenData = await this.getTokenData()
		return tokenData ? tokenData.accessToken : null
	}

	/**
	 * Check if this manager supports token refresh
	 */
	supportsRefresh(): boolean {
		return true
	}

	/**
	 * Refresh the tokens if needed
	 * This is a core method that handles token refresh logic
	 * with concurrency control
	 */
	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		// If refresh is already in progress, wait for it to complete
		if (this.refreshLock) {
			if (this.config.debug) {
				// Debug log removed
			}
			return this.refreshLock
		}

		// Get the current token data
		const tokenData = await this.getTokenData()

		// Check if a refresh is needed
		const force = options?.force || false
		const refreshThresholdMs = this.config.refreshThresholdMs

		// Force refresh or check if token is expiring soon
		const shouldRefresh =
			force ||
			(tokenData &&
				this.shouldRefreshToken(tokenData.expiresAt, refreshThresholdMs))

		if (shouldRefresh) {
			if (this.config.debug) {
				// Debug log removed
			}

			// Get the refresh token to use
			const refreshToken =
				options?.refreshToken || tokenData?.refreshToken || ''

			if (!refreshToken) {
				throw new SchwabAuthError(
					AuthErrorCode.REFRESH_NEEDED,
					'No refresh token available for token refresh',
				)
			}

			// Create the refresh lock and start the refresh process
			this.refreshLock = this.doRefreshWithRetry(refreshToken, force)

			try {
				// Wait for the refresh to complete
				const result = await this.refreshLock
				return result
			} finally {
				// Clear the lock when done
				this.refreshLock = null
			}
		} else if (tokenData) {
			// No refresh needed, return the current token data
			return tokenData
		}

		// No valid tokens and no refresh possible
		throw new SchwabAuthError(
			AuthErrorCode.REFRESH_NEEDED,
			'No valid tokens available and cannot refresh',
		)
	}

	/**
	 * Register a callback to be notified when tokens are refreshed
	 */
	onRefresh(callback: (tokenData: TokenSet) => void): void {
		this.refreshCallbacks.push(callback)
	}

	/**
	 * Refresh tokens using a specific refresh token
	 * This implements the FullAuthClient interface
	 */
	async refresh(
		refreshToken: string,
		options?: { force?: boolean },
	): Promise<TokenSet> {
		const tokenData = await this.refreshIfNeeded({
			refreshToken,
			force: options?.force,
		})

		return {
			accessToken: tokenData.accessToken,
			refreshToken: tokenData.refreshToken || '',
			expiresAt: tokenData.expiresAt || 0,
		}
	}

	/**
	 * Register a callback to handle reconnection events
	 * This is useful for handling token expiration scenarios
	 */
	addReconnectionHandler(handler: () => Promise<void>): void {
		this.reconnectionHandlers.push(handler)
	}

	/**
	 * Trigger the reconnection process
	 * This calls all registered reconnection handlers
	 */
	async triggerReconnection(): Promise<void> {
		// If reconnection is already in progress, return
		if (this.isReconnecting) {
			if (this.config.debug) {
				// Debug log removed
			}
			return
		}

		try {
			if (this.config.debug) {
				// Debug log removed
			}

			// Mark reconnection as in progress
			this.isReconnecting = true

			// Call all reconnection handlers
			for (const handler of this.reconnectionHandlers) {
				try {
					await handler()
				} catch (e) {
					console.error('Error calling reconnection handler', e)
					if (this.config.debug) {
						// Warning log removed
					}
				}
			}

			if (this.config.debug) {
				// Debug log removed
			}
		} catch (error) {
			console.error('Error triggering reconnection', error)
			if (this.config.debug) {
				// Error log removed
			}
		} finally {
			// Reset reconnection flag
			this.isReconnecting = false
		}
	}

	/**
	 * Wait for any ongoing reconnection process to complete
	 */
	private async waitForReconnection(): Promise<void> {
		// Simple polling approach to wait for reconnection to complete
		while (this.isReconnecting) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	}

	/**
	 * Check if a token needs to be refreshed
	 */
	private shouldRefreshToken(
		expiresAt?: number,
		thresholdMs?: number,
	): boolean {
		if (!expiresAt) {
			return true
		}

		// Use provided threshold or default
		const refreshThreshold = thresholdMs ?? this.config.refreshThresholdMs
		const now = Date.now()
		return expiresAt <= now + refreshThreshold
	}

	/**
	 * Map OIDC token response to our TokenData format
	 */
	private mapToTokenData(tokenSet?: SchwabTokenResponse): TokenData | null {
		if (!tokenSet || !tokenSet.access_token) {
			return null
		}

		// Calculate expiration time in milliseconds
		const expiresAtMs = Date.now() + (tokenSet.expires_in || 0) * 1000

		return {
			accessToken: tokenSet.access_token,
			refreshToken: tokenSet.refresh_token || '',
			expiresAt: expiresAtMs,
		}
	}

	/**
	 * Load tokens from persistent storage
	 */
	private async loadTokensFromStorage(): Promise<TokenData | null> {
		try {
			if (!this.loadFn) {
				return null
			}

			const tokens = await this.loadFn()
			if (!tokens) {
				// No tokens available
				this.logPersistenceEvent('No tokens found in storage')
				return null
			}

			// Track loaded tokens for event handling
			this.lastLoadedTokens = {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresAt: tokens.expiresAt,
			}

			// Notify about token load success
			this.dispatchTokenEvent(
				TokenPersistenceEvent.TOKEN_LOADED,
				this.lastLoadedTokens,
			)

			// Optional validation if enabled
			if (this.validateOnLoad) {
				const isValid = this.validateTokens(tokens)
				if (!isValid) {
					// Tokens failed validation
					this.dispatchTokenEvent(
						TokenPersistenceEvent.TOKEN_VALIDATION_FAILED,
						this.lastLoadedTokens,
					)
					return null
				}

				// Tokens are valid
				this.dispatchTokenEvent(
					TokenPersistenceEvent.TOKEN_VALIDATED,
					this.lastLoadedTokens,
				)
			}

			return this.lastLoadedTokens
		} catch (error) {
			// Handle load error
			this.dispatchTokenEvent(
				TokenPersistenceEvent.TOKEN_LOAD_FAILED,
				{
					accessToken: '',
					refreshToken: '',
					expiresAt: 0,
				},
				{ error },
			)

			// Rethrow to signal failure
			throw error
		}
	}

	/**
	 * Persist tokens to storage
	 * @param tokens The token set to persist
	 * @param metadata Optional metadata about the persistence operation
	 */
	private async persistTokens(
		tokens: TokenSet,
		metadata?: Record<string, any>,
	): Promise<void> {
		try {
			if (!this.saveFn) {
				return
			}

			// Validate tokens before saving
			const isValid = this.validateTokens(tokens)
			if (!isValid) {
				throw new Error('Invalid tokens, refusing to save')
			}

			// Track tokens being saved
			this.lastSavedTokens = {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresAt: tokens.expiresAt,
			}

			// Save tokens
			await this.saveFn(tokens)

			// Notify of successful save with metadata
			this.dispatchTokenEvent(
				TokenPersistenceEvent.TOKEN_SAVED,
				this.lastSavedTokens,
				metadata,
			)
		} catch (error) {
			// Handle save error
			this.dispatchTokenEvent(
				TokenPersistenceEvent.TOKEN_SAVE_FAILED,
				this.lastSavedTokens || {
					accessToken: '',
					refreshToken: '',
					expiresAt: 0,
				},
				{ error },
			)

			// Rethrow to signal failure
			throw error
		}
	}

	/**
	 * Validate tokens to ensure they meet basic requirements
	 */
	private validateTokens(tokens: TokenSet): boolean {
		// Basic validation
		if (!tokens || typeof tokens !== 'object') {
			return false
		}

		// Access token is required
		if (!tokens.accessToken || typeof tokens.accessToken !== 'string') {
			return false
		}

		// Expiration time must be a valid number
		if (
			tokens.expiresAt === undefined ||
			typeof tokens.expiresAt !== 'number' ||
			tokens.expiresAt <= 0
		) {
			return false
		}

		// Refresh token should be a string (can be empty)
		if (
			tokens.refreshToken === undefined ||
			typeof tokens.refreshToken !== 'string'
		) {
			return false
		}

		return true
	}

	/**
	 * Clear all tokens from memory and storage
	 */
	async clearTokens(): Promise<void> {
		// Clear in-memory tokens
		this.tokenSet = undefined

		// Clear persistent storage if available
		if (this.saveFn) {
			try {
				await this.saveFn({
					accessToken: '',
					refreshToken: '',
					expiresAt: 0,
				})
			} catch (error) {
				console.error('Error clearing tokens', error)
			}
		}

		if (this.config.debug) {
			// Debug log removed
		}
	}

	/**
	 * Manually save tokens
	 * @param tokens The token set to save
	 * @param metadata Optional metadata about the save operation
	 */
	public async saveTokens(
		tokens: Partial<TokenSet>,
		metadata?: Record<string, any>,
	): Promise<void> {
		// Create a valid TokenSet from the partial input
		const tokenSet: TokenSet = {
			accessToken: tokens.accessToken || '',
			refreshToken: tokens.refreshToken || '',
			expiresAt: tokens.expiresAt || Date.now() + 3600 * 1000,
		}

		// Store in memory
		this.tokenSet = {
			access_token: tokenSet.accessToken,
			refresh_token: tokenSet.refreshToken,
			expires_in: Math.floor((tokenSet.expiresAt - Date.now()) / 1000),
			token_type: 'bearer',
		}

		// Persist to storage if available
		if (this.saveFn) {
			await this.persistTokens(tokenSet, metadata)
		}
	}

	/**
	 * Helper for logging persistence-related events
	 */
	private logPersistenceEvent(_message: string, _data?: any): void {
		if (this.persistenceDebugEnabled) {
			// Debug log removed
		}
	}

	/**
	 * Dispatch token lifecycle events
	 */
	private dispatchTokenEvent(
		event: TokenPersistenceEvent,
		data: TokenData,
		metadata?: Record<string, any>,
	): void {
		try {
			this.persistenceEventHandler?.(event, data, metadata)
		} catch (error) {
			console.error('Error dispatching token event', error)
		}
	}

	/**
	 * Perform a direct token refresh using the OIDC client
	 */
	private async performDirectTokenRefresh(
		refreshToken: string,
	): Promise<SchwabTokenResponse> {
		try {
			// Check if the refresh token needs URL encoding
			// Schwab refresh tokens often include special characters that require encoding
			if (
				refreshToken.includes('+') ||
				refreshToken.includes('/') ||
				refreshToken.includes('=')
			) {
				if (this.config.debug) {
					// Debug log removed
				}

				// Some tokens may be base64url encoded
				try {
					// Attempt to decode to check format
					const decoded = this.base64urlDecode(refreshToken)
					if (decoded && decoded.length > 0) {
						// Token appears to be base64url encoded
						// No need to re-encode
					}
				} catch (e) {
					console.error('Error decoding refresh token', e)
					// Error during decode implies not base64url, may need encoding
					if (this.config.debug) {
						// Error log removed
					}
				}
			}

			// Prepare the refresh token request
			const params = {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
			}

			// Perform the token exchange
			return await this.performDirectTokenExchange(params)
		} catch (error) {
			// Rethrow with enhanced context
			throw this.formatTokenError(
				error,
				'Failed to refresh token',
				AuthErrorCode.TOKEN_EXPIRED,
			)
		}
	}

	/**
	 * Perform a direct token exchange using fetch
	 * This avoids direct dependency on specific OIDC implementations
	 */
	private async performDirectTokenExchange(
		params: Record<string, string>,
	): Promise<SchwabTokenResponse> {
		if (this.config.debug) {
			// Debug log removed
		}

		// Prepare the form data
		const formData = new URLSearchParams()
		Object.entries(params).forEach(([key, value]) => {
			formData.append(key, value)
		})

		// Create basic auth header
		let headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		}

		// Add Basic Auth if client credentials are provided
		if (params.client_id && params.client_secret) {
			try {
				// Create Basic Auth header
				const credentials = `${params.client_id}:${params.client_secret}`
				let authHeader: string

				if (typeof Buffer !== 'undefined') {
					// Node.js environment
					if (this.config.debug) {
						// Debug log removed
					}
					authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`
				} else {
					// Browser environment
					authHeader = `Basic ${btoa(credentials)}`
				}

				headers.Authorization = authHeader
			} catch (e) {
				console.error('Error creating Basic Auth header', e)
				if (this.config.debug) {
					// Error log removed
				}
				// Fall back to sending credentials in body
			}
		}

		// Get the token endpoint from the OIDC configuration
		const tokenEndpoint = `${this.config.issuerBaseUrl}/oauth/token`

		if (!tokenEndpoint) {
			throw new Error('Token endpoint not available in OIDC configuration')
		}

		// Make the token request
		const response = await this.config.fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: formData.toString(),
		})

		// Parse the response
		if (response.ok) {
			return await response.json()
		} else {
			// Handle error response
			let errorText: string
			let errorJson: any

			try {
				errorText = await response.text()
				try {
					errorJson = JSON.parse(errorText)
				} catch (e) {
					console.error('Error parsing error response', e)
					if (this.config.debug) {
						// Debug log removed
					}
					// Not JSON, use text as is
				}
			} catch (error) {
				console.error('Error parsing error response', error)
				errorText = 'Failed to parse error response'
			}

			if (this.config.debug) {
				// Error log removed
			}

			// Throw detailed error
			throw new Error(
				`Token exchange failed with status ${response.status}: ${
					errorJson?.error_description ||
					errorJson?.error ||
					errorText ||
					response.statusText
				}`,
			)
		}
	}

	/**
	 * Helper for base64url decoding
	 */
	private base64urlDecode(str: string): string {
		// Convert base64url to base64
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
		// Add padding if needed
		while (base64.length % 4) {
			base64 += '='
		}
		// Decode
		try {
			if (typeof Buffer !== 'undefined') {
				// Node.js
				return Buffer.from(base64, 'base64').toString()
			} else {
				// Browser
				return atob(base64)
			}
		} catch (e) {
			console.error('Error decoding refresh token', e)
			throw new Error('Invalid base64 string')
		}
	}

	/**
	 * Handle token refresh with auto-reconnection
	 */
	private async handleTokenRefreshWithReconnection(
		error: unknown,
		_refreshToken: string,
	): Promise<TokenData> {
		if (!this.config.autoReconnect) {
			// Auto-reconnect is disabled, just throw the error
			throw error
		}

		if (this.config.debug) {
			// Debug log removed
		}

		// Check if we need to trigger reconnection
		const isAuthError =
			error instanceof SchwabAuthError &&
			(error.code === AuthErrorCode.TOKEN_EXPIRED ||
				error.code === AuthErrorCode.REFRESH_NEEDED)

		if (isAuthError) {
			// Try to load tokens from storage first
			const loadedTokens = await this.loadTokensFromStorage()
			if (!loadedTokens || !loadedTokens.refreshToken) {
				if (this.config.debug) {
					// Debug log removed
				}
				// No tokens available, trigger reconnection
				await this.triggerReconnection()
				throw error
			}

			// Try with the loaded refresh token
			try {
				if (this.config.debug) {
					// Debug log removed
				}

				// Force refresh with the loaded token
				const result = await this.doRefreshWithRetry(
					loadedTokens.refreshToken,
					true,
				)

				if (this.config.debug) {
					// Debug log removed
				}

				return result
			} catch (refreshError) {
				if (this.config.debug) {
					// Warning log removed
				}

				// If refresh fails, check if we have a valid access token
				if (loadedTokens.expiresAt && loadedTokens.expiresAt > Date.now()) {
					// The access token is still valid, use it
					return loadedTokens
				}

				// No refresh token or expired tokens, trigger reconnection
				await this.triggerReconnection()
				throw refreshError
			}
		}

		// For other errors, just throw
		throw error
	}

	/**
	 * Perform a token refresh with retry logic
	 */
	private async doRefreshWithRetry(
		refreshToken: string,
		_force: boolean = false,
	): Promise<TokenData> {
		let lastError: unknown
		let attempt = 0

		// Record the refresh attempt time
		this.lastRefreshAttempt = Date.now()

		// Try up to maxRetryAttempts times
		while (attempt < this.config.maxRetryAttempts) {
			try {
				// Log retry attempt
				if (attempt > 0 && this.config.debug) {
					// Debug log removed
				}

				// Perform the actual token refresh
				const response = await this.performDirectTokenRefresh(refreshToken)

				// Create a TokenSet from the response
				const tokenSet: TokenSet = {
					accessToken: response.access_token!,
					refreshToken: response.refresh_token || refreshToken, // Use old refresh token if not returned
					expiresAt: Date.now() + (response.expires_in || 0) * 1000,
				}

				// Update the token in memory
				this.tokenSet = response as SchwabTokenResponse

				// Persist the tokens if storage is available with refresh metadata
				await this.persistTokens(tokenSet, {
					operation: 'refresh',
					attempt: attempt + 1,
					success: true,
					refreshId: this.config.traceOperations
						? this.tracer.startRefreshTrace()
						: undefined,
					timestamp: Date.now(),
				})

				// Log success
				if (this.config.debug) {
					// Debug log removed
				}

				// Notify listeners
				this.notifyRefreshListeners(tokenSet)

				// Return the token data
				return {
					accessToken: tokenSet.accessToken,
					refreshToken: tokenSet.refreshToken,
					expiresAt: tokenSet.expiresAt,
				}
			} catch (error) {
				lastError = error

				// Check if the error is retryable
				if (!this.isRetryableError(error)) {
					// Non-retryable errors should be handled immediately
					if (this.config.debug) {
						// Debug log removed
					}
					break
				}

				// Increment attempt counter
				attempt++

				// If we have more attempts, wait before retrying
				if (attempt < this.config.maxRetryAttempts) {
					// Calculate delay with optional exponential backoff
					const delay = this.calculateRetryDelay(attempt)

					if (this.config.debug) {
						// Debug log removed
					}

					// Wait for the calculated delay
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
			}
		}

		// If we got here, all attempts failed, try auto-reconnection
		return this.handleTokenRefreshWithReconnection(lastError!, refreshToken)
	}

	/**
	 * Determine if an error is retryable
	 */
	private isRetryableError(error: unknown): boolean {
		// Network-related errors are retryable
		if (
			error instanceof TypeError &&
			(error.message.includes('network') ||
				error.message.includes('connection') ||
				error.message.includes('abort'))
		) {
			return true
		}

		// Server errors (5xx) are retryable
		if (error instanceof Error && 'status' in error) {
			const status = (error as any).status
			if (typeof status === 'number' && status >= 500 && status < 600) {
				return true
			}
		}

		// Rate limit errors (429) are retryable
		if (error instanceof Error && 'status' in error) {
			const status = (error as any).status
			if (typeof status === 'number' && status === 429) {
				return true
			}
		}

		// Specific token error messages that might be retryable
		if (
			error instanceof Error &&
			(error.message.includes('timeout') ||
				error.message.includes('temporary') ||
				error.message.includes('service unavailable'))
		) {
			return true
		}

		// Authentication errors are generally not retryable
		if (error instanceof SchwabAuthError) {
			if (this.config.debug) {
				// Debug log removed
			}
			return false
		}

		// Unknown errors - allow retry as a fallback
		if (this.config.debug) {
			// Debug log removed
		}
		return true
	}

	/**
	 * Calculate the delay before the next retry attempt
	 */
	private calculateRetryDelay(attempt: number): number {
		const { initialRetryDelayMs, maxRetryDelayMs, useExponentialBackoff } =
			this.config

		if (useExponentialBackoff) {
			// Exponential backoff: initialDelay * 2^attempt
			const delay = initialRetryDelayMs * Math.pow(2, attempt)
			// Cap at maxRetryDelayMs
			return Math.min(delay, maxRetryDelayMs)
		} else {
			// Linear backoff: initialDelay * attempt
			const delay = initialRetryDelayMs * (attempt + 1)
			// Cap at maxRetryDelayMs
			return Math.min(delay, maxRetryDelayMs)
		}
	}

	/**
	 * Format token-related errors for consistent handling
	 */
	private formatTokenError(
		error: unknown,
		defaultMessage: string,
		code: AuthErrorCode,
	): SchwabAuthError {
		if (error instanceof SchwabAuthError) {
			return error
		}

		let message = defaultMessage
		let status: number | undefined

		if (error instanceof Error) {
			message = error.message

			if ('status' in error && typeof (error as any).status === 'number') {
				status = (error as any).status
			}
		}

		return new SchwabAuthError(code, message, status, {
			originalError: error,
		})
	}

	/**
	 * Notify all registered refresh listeners
	 */
	private notifyRefreshListeners(tokenSet: TokenSet): void {
		const failedCallbacks: Array<{ index: number; error: unknown }> = []

		for (let i = 0; i < this.refreshCallbacks.length; i++) {
			const callback = this.refreshCallbacks[i]
			try {
				callback?.(tokenSet)
			} catch (callbackError) {
				// Collect errors but don't throw
				failedCallbacks.push({
					index: i,
					error: callbackError,
				})
			}
		}

		// Log any callback errors
		if (failedCallbacks.length > 0 && this.config.debug) {
			// Warning log removed
		}
	}

	/**
	 * Generate a comprehensive token status report
	 * This combines information about current tokens, validation status, and refresh history
	 */
	async generateTokenReport(): Promise<{
		currentTokens: TokenData | null
		lastSavedTokens: TokenData | undefined
		lastLoadedTokens: TokenData | undefined
		tokenValidation: {
			valid: boolean
			reason?: string
			canRefresh?: boolean
			isExpiring?: boolean
			expiresInSeconds?: number
			format?: { isValid: boolean; issues?: string[] }
		} | null
		refreshHistory: any // From TokenRefreshTracer's report output
	}> {
		// Get current token state
		const currentTokens = await this.getTokenData()

		// Get token validation if tokens exist
		// validateToken is a hypothetical method based on existing validation logic
		const tokenValidation = currentTokens
			? this.validateTokenReport(currentTokens)
			: null

		return {
			currentTokens,
			lastSavedTokens: this.lastSavedTokens,
			lastLoadedTokens: this.lastLoadedTokens,
			tokenValidation,
			refreshHistory: this.tracer.getLatestRefreshReport(),
		}
	}

	/**
	 * Get diagnostics information about the current authentication state
	 * This method helps troubleshoot 401 Unauthorized errors by providing token status details
	 *
	 * @param options Options for diagnostics
	 * @returns Detailed diagnostics information
	 */
	public async getDiagnostics(
		options: AuthDiagnosticsOptions = {},
	): Promise<AuthDiagnosticsResult> {
		const environmentInfo = {
			apiEnvironment: this.config.issuerBaseUrl.includes('sandbox')
				? 'SANDBOX'
				: 'PRODUCTION',
			clientId: this.config.clientId, // Or first 8 chars
		}

		// Call the existing getAuthDiagnostics function
		const diagnostics = await getAuthDiagnostics(this, environmentInfo, options)

		// Integrate authHeaderTest logic
		try {
			const accessToken = await this.getAccessToken()
			if (accessToken) {
				const authHeader = `Bearer ${accessToken}`
				const isCorrectFormat = authHeader.startsWith('Bearer ')
				diagnostics.authHeaderTest = {
					success: true,
					isCorrectFormat,
					format: isCorrectFormat ? 'Valid Bearer format' : 'Incorrect format',
					preview: `Bearer ${accessToken.substring(0, 8)}...`,
				}
			} else {
				diagnostics.authHeaderTest = {
					success: false,
					reason: 'No access token available',
				}
			}
		} catch (headerError) {
			diagnostics.authHeaderTest = {
				success: false,
				error:
					headerError instanceof Error
						? headerError.message
						: String(headerError),
			}
		}
		return diagnostics
	}

	/**
	 * Validate tokens and return a detailed report
	 * This is used by generateTokenReport to provide more detailed validation info
	 */
	private validateTokenReport(tokenData: TokenData): {
		valid: boolean
		reason?: string
		canRefresh?: boolean
		isExpiring?: boolean
		expiresInSeconds?: number
		format?: { isValid: boolean; issues?: string[] }
	} {
		const now = Date.now()
		const issues: string[] = []

		// Check if token exists
		if (!tokenData.accessToken) {
			return {
				valid: false,
				reason: 'No access token available',
				format: { isValid: false, issues: ['Missing access token'] },
			}
		}

		// Check if token is expired
		if (!tokenData.expiresAt || tokenData.expiresAt <= now) {
			return {
				valid: false,
				reason: 'Token is expired',
				canRefresh: !!tokenData.refreshToken,
				isExpiring: true,
				expiresInSeconds: tokenData.expiresAt
					? Math.floor((tokenData.expiresAt - now) / 1000)
					: 0,
				format: { isValid: true, issues: [] },
			}
		}

		// Check if token is about to expire
		const expiresInMs = tokenData.expiresAt - now
		const isExpiring = expiresInMs <= this.config.refreshThresholdMs

		// Format validation
		let formatValid = true

		// Basic token validation checks
		if (
			typeof tokenData.accessToken !== 'string' ||
			tokenData.accessToken.length < 10
		) {
			issues.push('Access token appears malformed')
			formatValid = false
		}

		if (tokenData.refreshToken && typeof tokenData.refreshToken !== 'string') {
			issues.push('Refresh token is not a string')
			formatValid = false
		}

		return {
			valid: !isExpiring && formatValid,
			reason: isExpiring ? 'Token is nearing expiration' : undefined,
			canRefresh: !!tokenData.refreshToken,
			isExpiring,
			expiresInSeconds: Math.floor(expiresInMs / 1000),
			format: {
				isValid: formatValid,
				issues: issues.length > 0 ? issues : undefined,
			},
		}
	}
}
