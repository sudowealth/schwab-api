import { type TokenData, type TokenSet } from './types'

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

/**
 * Interface for token persistence options
 */
export interface TokenPersistenceOptions {
	/**
	 * Function to save tokens to storage
	 */
	save?: (tokens: TokenSet) => Promise<void>

	/**
	 * Function to load tokens from storage
	 */
	load?: () => Promise<TokenSet | null>

	/**
	 * Enable detailed debug logging
	 * @default false
	 */
	debug?: boolean

	/**
	 * Enable validation of tokens after loading
	 * @default true
	 */
	validateOnLoad?: boolean

	/**
	 * Event handler for token persistence lifecycle events
	 */
	onEvent?: TokenPersistenceEventHandler
}

/**
 * Enhanced token persistence manager that provides more robust token storage,
 * validation, and lifecycle event notifications.
 */
export class TokenPersistenceManager {
	private saveFn?: (tokens: TokenSet) => Promise<void>
	private loadFn?: () => Promise<TokenSet | null>
	private debugEnabled: boolean
	private validateOnLoad: boolean
	private eventHandler?: TokenPersistenceEventHandler
	private lastSavedTokens?: TokenData
	private lastLoadedTokens?: TokenData

	constructor(options: TokenPersistenceOptions = {}) {
		this.saveFn = options.save
		this.loadFn = options.load
		this.debugEnabled = options.debug || false
		this.validateOnLoad = options.validateOnLoad !== false
		this.eventHandler = options.onEvent
	}

	/**
	 * Register an event handler for token persistence lifecycle events
	 */
	onEvent(handler: TokenPersistenceEventHandler): void {
		this.eventHandler = handler
	}

	/**
	 * Enable or disable debug mode
	 */
	setDebug(enabled: boolean): void {
		this.debugEnabled = enabled
	}

	/**
	 * Trigger an event with the provided data
	 */
	private triggerEvent(
		event: TokenPersistenceEvent,
		data: TokenData,
		metadata?: Record<string, any>,
	): void {
		if (this.eventHandler) {
			try {
				this.eventHandler(event, data, metadata)
			} catch (error) {
				this.logDebug('Error in event handler', {
					event,
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}
	}

	/**
	 * Log a debug message if debug mode is enabled
	 */
	private logDebug(message: string, data?: Record<string, any>): void {
		if (this.debugEnabled) {
			console.debug(`[TokenPersistenceManager] ${message}`, data)
		}
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

		// Additional validations could be added here
		// Such as token format validation, issuer validation, etc.

		return true
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

		// Basic format validation for Schwab tokens
		// This could be expanded based on known token formats
		if (!refreshToken.match(/^[\w\-\.~+\/=]+$/)) {
			return {
				valid: false,
				reason: 'Refresh token contains invalid characters',
			}
		}

		return { valid: true }
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
}
