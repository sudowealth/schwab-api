import { SchwabAuthError } from '../errors'

// Define additional error codes for enhanced token manager
export enum TokenErrorCode {
	AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
	REFRESH_FAILED = 'REFRESH_FAILED',
}
import { OpenIdTokenManager } from './openid-manager'
import {
	TokenPersistenceManager,
	type TokenPersistenceEventHandler,
} from './token-persistence-manager'
import { TokenRefreshTracer } from './token-refresh-tracer'
import {
	type TokenData,
	type TokenSet,
	type RefreshOptions,
	type AuthClientOptions,
	type FullAuthClient,
} from './types'

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
}

/**
 * Enhanced token manager that provides improved token lifecycle management,
 * with robust persistence, validation, retry logic, and reconnection handling.
 */
export class EnhancedTokenManager implements FullAuthClient {
	private tokenManager: OpenIdTokenManager
	persistenceManager: TokenPersistenceManager // Made public for typechecking
	private tracer: TokenRefreshTracer
	private refreshCallbacks: Array<(t: TokenSet) => void> = []
	private reconnectionHandlers: Array<() => Promise<void>> = []
	private config: Required<
		Omit<EnhancedTokenManagerOptions, 'save' | 'load' | 'onTokenEvent'>
	> & {
		save: AuthClientOptions['save']
		load: AuthClientOptions['load']
		onTokenEvent: TokenPersistenceEventHandler | undefined
	}
	private isReconnecting: boolean = false
	private lastRefreshAttempt: number = 0
	private refreshLock: Promise<TokenData> | null = null

	constructor(options: EnhancedTokenManagerOptions) {
		// Set default configuration values
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
			refreshThresholdMs: options.refreshThresholdMs ?? 300000,
			debug: options.debug ?? false,
			validateTokens: options.validateTokens !== false,
			autoReconnect: options.autoReconnect !== false,
			onTokenEvent: options.onTokenEvent,
			traceOperations: options.traceOperations ?? false,
		}

		// Initialize token manager
		this.tokenManager = new OpenIdTokenManager({
			clientId: this.config.clientId,
			clientSecret: this.config.clientSecret,
			redirectUri: this.config.redirectUri,
			scope: this.config.scope,
			fetch: this.config.fetch,
			// We'll handle token persistence ourselves
			load: undefined,
			save: undefined,
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

		// Initialize persistence manager with safe implementations
		this.persistenceManager = new TokenPersistenceManager({
			save: dummySave,
			load: dummyLoad,
			debug: this.config.debug,
			validateOnLoad: this.config.validateTokens,
			onEvent: dummyEventHandler,
		})

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
	 * Get the authorization URL for OAuth flow
	 */
	getAuthorizationUrl(opts?: { scope?: string[]; state?: string }): {
		authUrl: string
	} {
		return this.tokenManager.getAuthorizationUrl(opts)
	}

	/**
	 * Exchange an authorization code for tokens
	 */
	async exchangeCode(code: string): Promise<TokenSet> {
		try {
			const tokenSet = await this.tokenManager.exchangeCode(code)

			// Trace the token exchange
			if (this.config.traceOperations) {
				this.tracer.recordTokenValidation(
					true,
					tokenSet,
					'Tokens obtained from code exchange',
				)
			}

			// Save tokens to persistence store
			await this.persistenceManager.saveTokens(tokenSet, {
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

		// Try to get token data from the token manager first
		let tokenData = await this.tokenManager.getTokenData()

		// If no token data, try to load from persistence
		if (!tokenData) {
			if (this.config.debug) {
				console.debug(
					'[EnhancedTokenManager] No active tokens, attempting to load from storage',
				)
			}

			// Load tokens from persistence
			const loadedTokens = await this.persistenceManager.loadTokens()

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

				// Preemptively refresh if tokens are expired or will expire soon
				if (this.shouldRefreshToken(loadedTokens)) {
					if (this.config.debug) {
						console.debug(
							'[EnhancedTokenManager] Loaded tokens need refresh, attempting refresh',
						)
					}

					try {
						// Attempt refresh with explicit token
						tokenData = await this.refreshWithRetry({
							force: true,
							refreshToken: loadedTokens.refreshToken,
						})
					} catch (error) {
						console.warn(
							'[EnhancedTokenManager] Failed to refresh loaded tokens',
							error,
						)

						// Fall back to the loaded tokens even if refresh failed
						// This gives the user a chance to use the tokens if they're still valid
						tokenData = loadedTokens
					}
				} else {
					// Use loaded tokens as-is
					tokenData = loadedTokens
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
	 * Refresh tokens using a specific refresh token with retry logic
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
	 */
	validateToken(tokenData: TokenData): {
		valid: boolean
		reason?: string
		canRefresh?: boolean
	} {
		// Basic validation
		if (!tokenData) {
			return { valid: false, reason: 'Token data is undefined or null' }
		}

		if (!tokenData.accessToken) {
			return { valid: false, reason: 'Access token is missing' }
		}

		// Check if the token has refresh capability
		const canRefresh = !!tokenData.refreshToken

		// Check for expiration
		const isExpired = this.isTokenExpired(tokenData)
		if (isExpired) {
			return {
				valid: false,
				reason: 'Token is expired',
				canRefresh,
			}
		}

		// Validate refresh token if present
		if (tokenData.refreshToken) {
			const refreshTokenValidation =
				this.persistenceManager.validateRefreshToken(tokenData.refreshToken)

			if (!refreshTokenValidation.valid) {
				return {
					valid: false,
					reason: `Invalid refresh token: ${refreshTokenValidation.reason}`,
					canRefresh: false,
				}
			}
		}

		return { valid: true, canRefresh }
	}

	/**
	 * Clear all token data and state
	 * Useful for logout or when tokens need to be completely reset
	 */
	async clearTokens(): Promise<void> {
		// Clear persistence manager state
		this.persistenceManager.clearTokenState()

		// Force reset the token manager by exchanging for a new instance
		this.tokenManager = new OpenIdTokenManager({
			clientId: this.config.clientId,
			clientSecret: this.config.clientSecret,
			redirectUri: this.config.redirectUri,
			scope: this.config.scope,
			fetch: this.config.fetch,
		})

		// Record the operation if tracing is enabled
		if (this.config.traceOperations) {
			this.tracer.recordTokenSave(true)
		}

		if (this.config.debug) {
			console.debug('[EnhancedTokenManager] All tokens cleared')
		}
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
			lastSavedTokens: this.persistenceManager.getLastSavedTokens(),
			lastLoadedTokens: this.persistenceManager.getLastLoadedTokens(),
			tokenValidation,
			refreshHistory: this.tracer.getLatestRefreshReport(),
		}
	}

	/**
	 * Private method to handle auto-reconnection
	 */
	private async handleAutoReconnect(): Promise<void> {
		if (this.config.debug) {
			console.debug('[EnhancedTokenManager] Handling auto-reconnection')
		}

		// Load tokens from storage
		const loadedTokens = await this.persistenceManager.loadTokens({
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

		// Check if token is expired or will expire soon
		return tokenData.expiresAt <= Date.now() + this.config.refreshThresholdMs
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
				const currentTokens = await this.tokenManager.getTokenData()

				// Use refresh token from current tokens
				refreshToken = currentTokens?.refreshToken

				// If still no refresh token, try to load from persistence
				if (!refreshToken) {
					const loadedTokens = await this.persistenceManager.loadTokens({
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
				const validation =
					this.persistenceManager.validateRefreshToken(refreshToken)
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
			let lastError: unknown = null

			while (attempt < this.config.maxRetryAttempts) {
				try {
					if (attempt > 0 && this.config.debug) {
						console.debug(
							`[EnhancedTokenManager] Retry attempt ${attempt + 1}/${this.config.maxRetryAttempts}`,
						)
					}

					// Perform the token refresh
					const tokenSet = await this.tokenManager.refresh(refreshToken)

					// Record success if tracing is enabled
					if (this.config.traceOperations) {
						this.tracer.recordRefreshSuccess(refreshId, tokenSet)
					}

					// Save tokens to persistence
					await this.persistenceManager.saveTokens(tokenSet, {
						operation: 'refresh',
						attempt: attempt + 1,
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
									attempt: attempt + 1,
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
				`Token refresh failed after ${attempt} attempts: ${errorMessage}`,
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

		// Check for specific HTTP status codes that indicate retryable errors
		if (error instanceof Error) {
			const status = (error as any).status

			if (status) {
				// Retry server errors (500s) and some specific client errors
				return (
					(status >= 500 && status < 600) || // Server errors
					status === 429 || // Too many requests
					status === 408 // Request timeout
				)
			}
		}

		// Don't retry validation errors or expired tokens
		if (error instanceof SchwabAuthError) {
			// Check the error code as string to avoid enum compatibility issues
			const code = (error as any).code
			return (
				code !== 'INVALID_CODE' && code !== TokenErrorCode.AUTHORIZATION_ERROR
			)
		}

		// Default to allowing retry for unknown errors
		return true
	}
}
