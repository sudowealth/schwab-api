import * as base64js from 'base64-js'
import pkceChallenge from 'pkce-challenge'
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
			fetch: options.fetch || globalThis.fetch.bind(globalThis),
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
	 * Get the authorization URL for the OAuth flow with PKCE support
	 * This is an asynchronous method to properly generate and include the code challenge
	 */
	private codeVerifierForCurrentFlow: string | null = null // Use this to hold the verifier for the current auth URL generation

	async getAuthorizationUrl(opts?: {
		scope?: string[]
		state?: string // This 'state' is from the calling application (schwab-mcp's AuthRequest)
	}): Promise<{
		authUrl: string
		generatedState?: string // Return the state we constructed so MCP can use it
	}> {
		const scope = opts?.scope || this.config.scope
		const baseIssuerUrl = this.config.issuerBaseUrl

		// Generate PKCE code verifier and challenge using pkce-challenge package
		const pkce = await pkceChallenge()
		this.codeVerifierForCurrentFlow = pkce.code_verifier // Store the verifier for later use
		const codeChallenge = pkce.code_challenge // Get the pre-computed challenge

		if (this.config.debug && this.codeVerifierForCurrentFlow) {
			console.log(
				`[EnhancedTokenManager] PKCE for getAuthUrl: verifier (len ${this.codeVerifierForCurrentFlow.length}), challenge (len ${codeChallenge.length}, starts ${codeChallenge.substring(0, 10)}...)`,
			)
		}

		const authParams: Record<string, string> = {
			client_id: this.config.clientId,
			scope: scope.join(' '),
			response_type: 'code',
			redirect_uri: this.config.redirectUri,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		}

		// Construct the state to be sent to Schwab
		// It will contain the calling app's original state AND our pkce_code_verifier
		let appSpecificStateData: any = {}
		if (opts?.state) {
			try {
				// First, make sure the state is a valid base64 string
				let decodedStateString: string
				try {
					decodedStateString = this.safeBase64Decode(opts.state)
				} catch (decodeError) {
					if (this.config.debug) {
						console.warn(
							`[EnhancedTokenManager] opts.state in getAuthorizationUrl failed base64 decoding: ${(decodeError as Error).message}. Treating as raw string.`,
						)
					}
					// If not base64, just use the raw string
					decodedStateString = opts.state
				}

				// Try to parse as JSON
				try {
					appSpecificStateData = JSON.parse(decodedStateString)
					if (this.config.debug) {
						console.log(
							`[EnhancedTokenManager] Successfully parsed opts.state as JSON: ${JSON.stringify(appSpecificStateData).substring(0, 100)}...`,
						)
					}
				} catch (jsonError) {
					if (this.config.debug) {
						console.warn(
							`[EnhancedTokenManager] Decoded state string is not valid JSON. Treating as opaque string. Error: ${(jsonError as Error).message}`,
						)
					}
					// If not JSON, wrap it as a string value
					appSpecificStateData = { original_app_state: decodedStateString }
				}
			} catch (e) {
				if (this.config.debug) {
					console.warn(
						`[EnhancedTokenManager] Failed to process opts.state in getAuthorizationUrl. Treating as opaque string. Original state: ${opts.state}`,
					)
				}
				console.error('Error processing opts.state in getAuthorizationUrl:', e)
				// Fall back to treating it as a raw string
				appSpecificStateData = { original_app_state: opts.state }
			}
		}

		const combinedStateObject = {
			...appSpecificStateData, // The calling app's state (e.g., oauthReqInfo)
			pkce_code_verifier: this.codeVerifierForCurrentFlow, // Our PKCE verifier
		}

		// Create the combined state with more robust base64 encoding
		let finalStateParamForSchwab: string
		try {
			// Use the safe base64 encoding helper
			finalStateParamForSchwab = this.safeBase64Encode(
				JSON.stringify(combinedStateObject),
			)
			if (this.config.debug) {
				console.log(
					`[EnhancedTokenManager] Generated state param (len ${finalStateParamForSchwab.length}): ${finalStateParamForSchwab.substring(0, 20)}...`,
				)
			}
		} catch (encodeError) {
			console.error(
				`[EnhancedTokenManager] Critical error encoding state: ${(encodeError as Error).message}`,
			)
			// Fall back to a simpler approach - encode just the code verifier without user state
			// This ensures PKCE still works even if we can't include the app state
			try {
				const fallbackState = {
					pkce_code_verifier: this.codeVerifierForCurrentFlow,
				}
				finalStateParamForSchwab = this.safeBase64Encode(
					JSON.stringify(fallbackState),
				)
				console.warn(
					'[EnhancedTokenManager] Using fallback state encoding (app state discarded due to encoding error)',
				)
			} catch (fallbackError) {
				// If all encoding fails, we're in a bad state but can't do much
				console.error(
					`[EnhancedTokenManager] Fatal encoding error for state: ${(fallbackError as Error).message}`,
				)
				// Don't include state at all - the exchange will fail but that's better than crashing here
				finalStateParamForSchwab = ''
			}
		}

		// Only add state if we successfully created it
		if (finalStateParamForSchwab) {
			authParams.state = finalStateParamForSchwab
		}

		const authUrl = `${baseIssuerUrl}/oauth/authorize?${new URLSearchParams(authParams).toString()}`

		// Only return generatedState if we successfully created it
		return {
			authUrl,
			...(finalStateParamForSchwab
				? { generatedState: finalStateParamForSchwab }
				: {}),
		}
	}
	/**
	 * Sanitize authorization code for Schwab's OAuth requirements
	 * This handles any encoding issues that might come up with special characters
	 * and ensures base64 padding is correctly handled.
	 *
	 * Specifically addresses:
	 * - Removing invalid base64 characters (like @ symbols)
	 * - Converting from base64url to standard base64 format
	 * - Adding proper padding to make length a multiple of 4
	 * - Handling URL-encoded characters
	 * @private
	 */
	/**
	 * Sanitize authorization code using the base64-js library for improved reliability
	 *
	 * This function processes an authorization code to ensure it's in valid Base64 format
	 * by handling URL-encoded characters, removing invalid chars, normalizing to
	 * standard Base64 format, and ensuring proper padding.
	 */
	private sanitizeAuthCode(code: string): string {
		// First trim any whitespace
		const trimmedCode = code.trim()

		// Only perform URL-decoding while preserving structure
		let processedCode = trimmedCode

		// Handle URL-encoded characters if present
		if (processedCode.includes('%')) {
			try {
				// Selectively handle URL-encoded characters that might appear in codes
				// Only handle specific known URL encodings to preserve structure
				processedCode = processedCode
					.replace(/%40/g, '@') // %40 = @
					.replace(/%7E/g, '~') // %7E = ~
					.replace(/%2B/g, '+') // %2B = +
					.replace(/%2F/g, '/') // %2F = /
					.replace(/%3D/g, '=') // %3D = =
					.replace(/%20/g, ' ') // %20 = space
				// DO NOT modify periods or other structural elements

				if (this.config.debug) {
					console.log(
						`[EnhancedTokenManager.sanitizeAuthCode] URL-decoded specific characters: '${trimmedCode.substring(0, 15)}...' => '${processedCode.substring(0, 15)}...'`,
					)
				}
			} catch (e) {
				// If specific URL decoding fails, preserve original code
				console.error(
					`[EnhancedTokenManager.sanitizeAuthCode] Error handling URL-encoded characters: ${(e as Error).message}`,
				)
				processedCode = trimmedCode // Revert to original
			}
		}

		if (this.config.debug) {
			// Log if the code contains periods for debugging purposes
			if (processedCode.includes('.')) {
				console.log(
					`[EnhancedTokenManager.sanitizeAuthCode] Code contains periods. Format preserved as: ${processedCode
						.split('.')
						.map((segment) => segment.substring(0, 5) + '...')
						.join('.')}`,
				)
			}

			console.log(
				`[EnhancedTokenManager.sanitizeAuthCode] Minimal processing applied, preserving structure: '${processedCode.substring(0, 15)}...'`,
			)
		}

		return processedCode
	}

	/**
	 * Exchange an authorization code for tokens
	 * This method is used after the user completes the authorization flow
	 * @param code The authorization code received from the OAuth server
	 * @param stateParam Optional state parameter received in the callback, may contain code_verifier
	 */
	async exchangeCode(code: string, stateParam?: string): Promise<TokenSet> {
		if (this.config.debug) {
			console.log(
				`[EnhancedTokenManager.exchangeCode] Received raw authorization code (length: ${code.length}): '${code.substring(0, 15)}...'`,
			)
			console.log(
				`[EnhancedTokenManager.exchangeCode] Received raw stateParam (length: ${stateParam?.length || 0}): '${stateParam ? stateParam.substring(0, 30) + '...' : 'undefined'}'`,
			)
		}

		const sanitizedCode = this.sanitizeAuthCode(code)
		if (this.config.debug) {
			console.log(
				`[EnhancedTokenManager.exchangeCode] Code was sanitized to: '${sanitizedCode.substring(0, 15)}...'`,
			)
			console.log(
				`[EnhancedTokenManager.exchangeCode] Code length before: ${code.length}, after: ${sanitizedCode.length}`,
			)
			console.log(
				`[EnhancedTokenManager.exchangeCode] Sanitized code length validation: ${sanitizedCode.length % 4 === 0 ? 'Valid length (multiple of 4)' : 'INVALID length (not a multiple of 4)'}`,
			)
		}

		let retrievedCodeVerifier: string | null = null

		if (!stateParam) {
			console.error(
				'[EnhancedTokenManager.exchangeCode] CRITICAL: stateParam is missing. PKCE code_verifier cannot be retrieved from state. This will likely lead to token exchange failure.',
			)
			// Attempt to use instance-stored verifier as a last resort, though this is less reliable across redirects
			// if a new ETM instance is created for the callback.
			if (this.codeVerifierForCurrentFlow) {
				// Assuming you renamed this.codeVerifier to this.codeVerifierForCurrentFlow
				console.warn(
					'[EnhancedTokenManager.exchangeCode] Attempting to use instance-stored codeVerifierForCurrentFlow as fallback due to missing stateParam.',
				)
				retrievedCodeVerifier = this.codeVerifierForCurrentFlow
			}
		} else {
			// First, pre-process the stateParam to handle potential URL encoding
			let processedStateParam = stateParam

			if (this.config.debug) {
				console.log(
					`[EnhancedTokenManager.exchangeCode] Processing stateParam (length: ${stateParam.length}, preview: '${stateParam.substring(0, 30)}...')`,
				)
			}

			// Check if the stateParam might be URL-encoded
			if (stateParam.includes('%')) {
				try {
					const decodedStateParam = decodeURIComponent(stateParam)
					if (this.config.debug) {
						console.log(
							`[EnhancedTokenManager.exchangeCode] State appears to be URL-encoded, decoded to: '${decodedStateParam.substring(0, 30)}...'`,
						)
					}
					processedStateParam = decodedStateParam
				} catch (e) {
					console.warn(
						`[EnhancedTokenManager.exchangeCode] Failed to URL-decode stateParam. Will use as-is. Error: ${(e as Error).message}`,
					)
					// Continue with original state param
				}
			}

			try {
				// Use our safe base64 decode function instead of atob
				const decodedStateString = this.safeBase64Decode(processedStateParam)
				if (this.config.debug) {
					console.log(
						`[EnhancedTokenManager.exchangeCode] Decoded state string from base64: '${decodedStateString.substring(0, 100)}...'`,
					)
				}
				const decodedStateObject = JSON.parse(decodedStateString)

				if (decodedStateObject && decodedStateObject.pkce_code_verifier) {
					retrievedCodeVerifier = decodedStateObject.pkce_code_verifier
					if (this.config.debug) {
						console.log(
							`[EnhancedTokenManager.exchangeCode] Successfully retrieved pkce_code_verifier from stateParam (length: ${retrievedCodeVerifier?.length}, starts with: ${retrievedCodeVerifier?.substring(0, 10)}...)`,
						)
					}
				} else {
					console.warn(
						'[EnhancedTokenManager.exchangeCode] pkce_code_verifier NOT found in decoded stateParam object. Decoded state:',
						decodedStateObject,
					)
				}
			} catch (e: any) {
				console.error(
					`[EnhancedTokenManager.exchangeCode] Failed to decode or parse stateParam: ${e.message}. Raw stateParam was: '${stateParam.substring(0, 50)}...'`,
				)
				// Even if state decoding fails, check if this.codeVerifierForCurrentFlow (instance property) was set as a desperate fallback
				if (this.codeVerifierForCurrentFlow) {
					console.warn(
						'[EnhancedTokenManager.exchangeCode] State decoding failed. Attempting to use instance-stored codeVerifierForCurrentFlow as fallback.',
					)
					retrievedCodeVerifier = this.codeVerifierForCurrentFlow
				}
			}
		}

		if (!retrievedCodeVerifier) {
			const errorMessage =
				'[EnhancedTokenManager.exchangeCode] CRITICAL: No code_verifier available for PKCE token exchange. Cannot proceed with token exchange.'
			console.error(errorMessage)
			if (this.config.debug && this.codeVerifierForCurrentFlow) {
				// This log helps understand if getAuthorizationUrl did set it on the instance
				console.log(
					`[EnhancedTokenManager.exchangeCode] Debug info: this.codeVerifierForCurrentFlow was (len ${this.codeVerifierForCurrentFlow.length}): ${this.codeVerifierForCurrentFlow.substring(0, 10)}...`,
				)
			}
			throw new SchwabAuthError(
				AuthErrorCode.INVALID_CODE, // Or a more specific PKCE error code if you define one
				'PKCE code_verifier is missing or could not be retrieved. Token exchange cannot be completed.',
			)
		}

		const params: Record<string, string> = {
			grant_type: 'authorization_code',
			code: sanitizedCode,
			redirect_uri: this.config.redirectUri,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret, // Schwab requires client_secret for server-side token exchange even with PKCE
			code_verifier: retrievedCodeVerifier,
		}

		if (this.config.debug) {
			const paramsForLog = { ...params }
			if (paramsForLog.client_secret) paramsForLog.client_secret = '[REDACTED]'
			if (paramsForLog.code)
				paramsForLog.code = `${paramsForLog.code.substring(0, 10)}... (len: ${paramsForLog.code.length})`
			if (paramsForLog.code_verifier)
				paramsForLog.code_verifier = `${paramsForLog.code_verifier.substring(0, 10)}... (len: ${paramsForLog.code_verifier.length})`

			console.log(
				'[EnhancedTokenManager.exchangeCode] Parameters for performDirectTokenExchange:',
				paramsForLog,
			)
		}

		try {
			const tokenResponseData = await this.performDirectTokenExchange(params)

			const tokenSet: TokenSet = {
				accessToken: tokenResponseData.access_token!,
				refreshToken: tokenResponseData.refresh_token || '',
				expiresAt: Date.now() + (tokenResponseData.expires_in || 0) * 1000,
			}

			this.tokenSet = tokenResponseData // Store the raw response
			await this.persistTokens(tokenSet, {
				operation: 'code_exchange',
				codeLength: code.length, // Original code length
				usedPkce: true,
				timestamp: Date.now(),
			})

			// Clear the instance verifier after successful use if it was the source
			// If it came from state, this.codeVerifierForCurrentFlow might be for a *previous* auth attempt if not careful with instance reuse.
			// It's generally safer to rely on the state-passed verifier for the specific exchange.
			this.codeVerifierForCurrentFlow = null

			if (this.config.debug) {
				console.log(
					'[EnhancedTokenManager.exchangeCode] Token exchange successful. Access token preview:',
					`${tokenSet.accessToken.substring(0, 8)}...`,
					`Expires in: ${tokenResponseData.expires_in}s`,
				)
			}

			return tokenSet
		} catch (error: any) {
			console.error(
				'[EnhancedTokenManager.exchangeCode] Error during performDirectTokenExchange:',
				error.message || error,
			)
			// The error from performDirectTokenExchange might already be well-formatted.
			// If it's a generic Error, re-wrap it.
			if (!(error instanceof SchwabAuthError)) {
				throw this.formatTokenError(
					// Ensure formatTokenError exists and works
					error,
					'Failed to exchange authorization code for tokens during direct exchange.',
					AuthErrorCode.UNAUTHORIZED, // Default, performDirectTokenExchange might throw more specific
				)
			}
			throw error // Re-throw if already a SchwabAuthError
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

				// Some tokens may be base64 encoded
				try {
					// Attempt to decode to check format
					const decoded = this.safeBase64Decode(refreshToken)
					if (decoded && decoded.length > 0) {
						// Token appears to be valid base64 encoded
						// No need to re-encode
					}
				} catch (e) {
					console.error('Error decoding refresh token', e)
					// Error during safe base64 decode implies not valid base64, may need encoding
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

		// Log request details when debug is enabled
		if (this.config.debug) {
			const redactedFormDataLog = new URLSearchParams()
			formData.forEach((value, key) => {
				if (key === 'client_secret') {
					redactedFormDataLog.append(key, '[REDACTED]')
				} else if (key === 'code') {
					// For code, show a portion to help with debugging
					const codePreview = value.substring(0, 10) + '...'
					redactedFormDataLog.append(key, codePreview)

					// Add code-specific diagnostics
					console.log(`[EnhancedTokenManager] Auth code diagnostics:`)
					console.log(`  - Length: ${value.length}`)
					console.log(`  - Preview: ${codePreview}`)
					console.log(`  - Contains special chars: ${/[+/=@.]/g.test(value)}`)
					console.log(
						`  - URL encoding check: ${encodeURIComponent(value) !== value ? 'Might need URL encoding' : 'Already encoded or no special chars'}`,
					)
				} else {
					redactedFormDataLog.append(key, value)
				}
			})
			const redactedHeaders = { ...headers }
			if (redactedHeaders.Authorization)
				redactedHeaders.Authorization = 'Basic [REDACTED]'

			console.log(`[EnhancedTokenManager] Performing direct token exchange.`)
			console.log(`  Endpoint: ${tokenEndpoint}`)
			console.log(`  Method: POST`)
			console.log(`  Headers: ${JSON.stringify(redactedHeaders)}`)
			console.log(`  Body: ${redactedFormDataLog.toString()}`)
		}

		// Make the token request with properly bound fetch to avoid "Illegal invocation" errors
		// We need to ensure fetch is bound correctly regardless of whether it's the global fetch or custom fetch
		let fetchFn: typeof fetch

		// Handle different ways fetch might be provided
		if (this.config.fetch === globalThis.fetch) {
			// Using the global fetch directly - bind to globalThis
			fetchFn = globalThis.fetch.bind(globalThis)
		} else if (typeof this.config.fetch === 'function') {
			// Using a custom fetch function - still needs binding to globalThis to avoid illegal invocation
			fetchFn = this.config.fetch.bind(globalThis)
		} else {
			// Fallback to global fetch in case something went wrong with config
			fetchFn = globalThis.fetch.bind(globalThis)
		}

		// Only perform URL-decoding while preserving structure for authorization code
		if (
			formData.get('grant_type') === 'authorization_code' &&
			formData.has('code')
		) {
			const originalCode = formData.get('code') || ''
			let processedCode = originalCode

			// Only URL-decode specific encoded characters if present
			if (processedCode.includes('%')) {
				try {
					// Only handle specific known URL encodings to preserve structure
					processedCode = processedCode
						.replace(/%40/g, '@') // %40 = @
						.replace(/%7E/g, '~') // %7E = ~
						.replace(/%2B/g, '+') // %2B = +
						.replace(/%2F/g, '/') // %2F = /
						.replace(/%3D/g, '=') // %3D = =
						.replace(/%20/g, ' ') // %20 = space
					// DO NOT modify periods (%2E) or other structural elements

					if (this.config.debug) {
						console.log(
							`[EnhancedTokenManager.performDirectTokenExchange] URL-decoded specific characters: '${originalCode.substring(0, 15)}...' => '${processedCode.substring(0, 15)}...'`,
						)
					}
				} catch (e) {
					// If specific URL decoding fails, preserve original code
					console.error(
						`[EnhancedTokenManager.performDirectTokenExchange] Error handling URL-encoded characters: ${(e as Error).message}`,
					)
					processedCode = originalCode // Revert to original
				}

				// Apply the changes if we made any
				if (processedCode !== originalCode) {
					formData.set('code', processedCode)

					if (this.config.debug) {
						console.log(
							`[EnhancedTokenManager.performDirectTokenExchange] Updated code with minimal URL-decoding while preserving structure`,
						)
					}
				}
			}

			if (this.config.debug) {
				// Add some debugging info about the format for troubleshooting
				if (processedCode.includes('.')) {
					console.log(
						`[EnhancedTokenManager.performDirectTokenExchange] Authorization code contains periods. Format preserved as: ${processedCode
							.split('.')
							.map((segment) => segment.substring(0, 5) + '...')
							.join('.')}`,
					)
				}

				console.log(
					`[EnhancedTokenManager.performDirectTokenExchange] Final authorization code (with minimal processing): '${processedCode.substring(0, 15)}...'`,
				)
			}
		}

		// Additional debug logging before making the request
		if (this.config.debug) {
			console.log(
				`[EnhancedTokenManager.performDirectTokenExchange] Making token request...`,
			)
			console.log(
				`[EnhancedTokenManager.performDirectTokenExchange] Request body length: ${formData.toString().length}`,
			)

			// Inspect grant_type and code specifically for debugging code exchange issues
			if (
				formData.get('grant_type') === 'authorization_code' &&
				formData.has('code')
			) {
				const code = formData.get('code')
				console.log(
					`[EnhancedTokenManager.performDirectTokenExchange] Code in request: length=${code?.length}, code=${code?.toString().substring(0, 15)}...`,
				)
				console.log(
					`[EnhancedTokenManager.performDirectTokenExchange] Code validation: length is ${code?.length && code.length % 4 === 0 ? 'valid (multiple of 4)' : 'INVALID (not a multiple of 4)'}`,
				)
				console.log(
					`[EnhancedTokenManager.performDirectTokenExchange] Is valid Base64 format: ${/^[A-Za-z0-9+/]*={0,2}$/.test(code || '') ? 'YES' : 'NO'}`,
				)
			}

			if (formData.has('code_verifier')) {
				const verifier = formData.get('code_verifier')
				console.log(
					`[EnhancedTokenManager.performDirectTokenExchange] Code verifier in request: length=${verifier?.length}, starts with=${verifier?.toString().substring(0, 10)}...`,
				)
			}
		}

		const response = await fetchFn(tokenEndpoint, {
			method: 'POST',
			headers,
			body: formData.toString(),
		})

		// Parse the response
		if (response.ok) {
			return await response.json()
		} else {
			// Handle error response with improved error capture
			let errorBodyContent: string = 'Could not read error response body.'
			let parsedErrorJson: any
			try {
				const errorResponseClone = response.clone() // Clone before reading
				errorBodyContent = await errorResponseClone.text() // Get raw text first
				try {
					parsedErrorJson = JSON.parse(errorBodyContent)
				} catch (e) {
					// Not JSON, errorBodyContent already has the text

					console.error(
						'[EnhancedTokenManager] Failed to parse error response body:',
						e,
					)
				}
			} catch (readError: any) {
				console.error(
					'[EnhancedTokenManager] Fatal: Failed to read error response body:',
					readError.message || readError,
				)
			}

			if (this.config.debug) {
				console.error(
					`[EnhancedTokenManager] Token exchange HTTP error ${response.status}. Full Response Body: ${errorBodyContent}`,
				)
			}

			// Throw detailed error, ensuring errorBodyContent is passed if parsedErrorJson is not available
			throw new Error(
				`Token exchange failed with status ${response.status}: ${
					parsedErrorJson?.error_description ||
					parsedErrorJson?.error ||
					errorBodyContent || // Use full text if JSON parsing failed or no specific error fields
					response.statusText
				}`,
			)
		}
	}

	/**
	 * Safe Base64 decoding using base64-js library
	 * - Handles standard base64 and base64url formats
	 * - Works consistently across Node.js and browser environments
	 * - Provides improved error handling
	 */
	private safeBase64Decode(input: string): string {
		try {
			// First check if we need to convert from base64url to standard base64
			const needsUrlDecoding = input.includes('-') || input.includes('_')
			let base64 = input

			if (needsUrlDecoding) {
				// Convert base64url to base64 for standard decoding
				base64 = input.replace(/-/g, '+').replace(/_/g, '/')
			}

			// Add padding if needed
			let paddedBase64 = base64
			while (paddedBase64.length % 4 !== 0) {
				paddedBase64 += '='
			}

			// Convert base64 string to binary data
			const binaryData = base64js.toByteArray(paddedBase64)

			// Convert binary data to string
			return new TextDecoder().decode(binaryData)
		} catch (error) {
			throw new Error(`Base64 decode error: ${(error as Error).message}`)
		}
	}

	/**
	 * Safe Base64 encoding using base64-js library
	 * - Encodes strings to base64 with consistent behavior across environments
	 * - Supports URL-safe base64 format (base64url)
	 * - Enhanced error handling
	 */
	private safeBase64Encode(input: string, urlSafe = true): string {
		try {
			// Convert string to binary data
			const binaryData = new TextEncoder().encode(input)

			// Use base64-js to encode binary data to base64
			let base64 = base64js.fromByteArray(binaryData)

			// Convert to URL-safe format if requested
			if (urlSafe) {
				return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
			}

			return base64
		} catch (error) {
			throw new Error(`Base64 encode error: ${(error as Error).message}`)
		}
	}

	/**
	 * PKCE functionality is now handled by the pkce-challenge package
	 *
	 * The package handles:
	 * 1. Generating a cryptographically random code verifier
	 * 2. Computing the code challenge using SHA-256 hashing
	 * 3. Proper base64url encoding of both values
	 */

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
