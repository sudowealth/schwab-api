import { SchwabAuthError, AuthErrorCode, SchwabError } from '../errors'
import {
	type TokenData,
	type ITokenLifecycleManager,
	type TokenManagerOptions,
	type RefreshOptions,
} from './types'

/**
 * @internal This class is not intended to be used directly.
 * Export it for index.ts to re-export
 */

/**
 * Basic implementation for a static token (no refresh capability)
 * Useful for simple scripts or when tokens are managed externally
 */
export class StaticTokenManager implements ITokenLifecycleManager {
	/**
	 * Create a static token manager with a fixed access token
	 * @param accessToken The static access token to use
	 */
	constructor(private accessToken: string) {}

	async getTokenData(): Promise<TokenData> {
		return { accessToken: this.accessToken }
	}

	async getAccessToken(): Promise<string> {
		return this.accessToken
	}

	supportsRefresh(): boolean {
		return false
	}
}

/**
 * Create a token manager from a static token string
 * @param accessToken The static access token
 * @returns A StaticTokenManager instance
 */
export function createStaticTokenManager(
	accessToken: string,
): StaticTokenManager {
	return new StaticTokenManager(accessToken)
}

/**
 * Function to determine if an object implements ITokenLifecycleManager
 * @param obj Object to check
 * @returns True if the object implements ITokenLifecycleManager
 */
export function isTokenLifecycleManager(
	obj: unknown,
): obj is ITokenLifecycleManager {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'getTokenData' in obj &&
		'getAccessToken' in obj &&
		'supportsRefresh' in obj &&
		typeof (obj as any).getTokenData === 'function' &&
		typeof (obj as any).getAccessToken === 'function' &&
		typeof (obj as any).supportsRefresh === 'function'
	)
}

/**
 * Adds concurrency protection to a token manager that supports refresh
 * This is a wrapper that ensures controlled concurrency for refresh operations
 *
 * @internal This class is used internally by buildTokenManager to ensure concurrency protection
 * and should not be instantiated directly by users.
 */
export class ConcurrentTokenManager implements ITokenLifecycleManager {
	private refreshInProgress: Promise<TokenData> | null = null
	private refreshCallbacks: Array<(tokenData: TokenData) => void> = []
	private activeRefreshCount: number = 0

	/**
	 * Create a concurrent token manager that wraps another token manager
	 * @param underlying The token manager to wrap
	 * @param options Configuration options
	 * @throws Error if the underlying manager doesn't support refresh
	 */
	constructor(
		private underlying: ITokenLifecycleManager,
		_options?: TokenManagerOptions,
	) {
		if (!underlying.supportsRefresh()) {
			throw new SchwabAuthError(
				AuthErrorCode.UNKNOWN,
				'ConcurrentTokenManager requires an underlying manager that supports refresh',
				undefined,
				{
					manager: underlying.constructor.name,
					supportsRefresh: underlying.supportsRefresh(),
				},
			)
		}

		// No need to forward refresh notifications from the underlying manager
		// We'll handle all notifications directly in our refreshIfNeeded method
	}

	async getTokenData(): Promise<TokenData | null> {
		return this.underlying.getTokenData()
	}

	/**
	 * Get the current access token, refreshing it if needed and handling concurrency
	 * This provides a unified code flow for token retrieval with built-in refresh handling
	 *
	 * @param options Optional refresh options if token refresh is needed
	 * @param options.refreshThresholdMs Time in milliseconds before expiration to trigger refresh (default: 5 min)
	 * @returns The current access token or null if not available
	 */
	async getAccessToken(options?: {
		refreshThresholdMs?: number
	}): Promise<string | null> {
		// Get the current token data
		const tokenData = await this.underlying.getTokenData()

		// If no token data is available, return null
		if (!tokenData) {
			return null
		}

		// Import the token utilities dynamically to avoid circular dependencies
		const { tokenIsExpiringSoon, DEFAULT_REFRESH_THRESHOLD_MS } = await import(
			'./token-utils'
		)

		// Default threshold is 5 minutes
		const refreshThresholdMs =
			options?.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS

		// Check if token needs refreshing and we support refresh
		if (
			this.supportsRefresh() &&
			this.refreshIfNeeded &&
			tokenIsExpiringSoon(tokenData.expiresAt, refreshThresholdMs)
		) {
			try {
				// Use our concurrency-protected refresh method
				const refreshedTokens = await this.refreshIfNeeded()
				return refreshedTokens.accessToken
			} catch (error) {
				// Log the error but don't throw - return the current token if still valid
				console.warn('Failed to refresh token:', error)

				// If the current token is still valid, use it
				if (tokenData.expiresAt && tokenData.expiresAt > Date.now()) {
					return tokenData.accessToken
				}

				// Re-throw the error if the token is expired
				throw error
			}
		}

		// Return the current token
		return tokenData.accessToken
	}

	supportsRefresh(): boolean {
		return true
	}

	onRefresh(callback: (tokenData: TokenData) => void): void {
		this.refreshCallbacks.push(callback)
	}

	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		// If there's already a refresh in progress, return that promise
		// rather than starting a new one - this ensures only one refresh happens at a time
		if (this.refreshInProgress) {
			return this.refreshInProgress
		}

		try {
			// Create a new refresh promise
			this.activeRefreshCount++
			this.refreshInProgress = this.doRefresh(options)

			// Wait for refresh and update state when done
			const result = await this.refreshInProgress

			// Clear the refreshInProgress flag
			this.refreshInProgress = null
			this.activeRefreshCount = 0

			return result
		} catch (error) {
			// Update state if there's an error
			this.refreshInProgress = null
			this.activeRefreshCount = 0

			throw error
		}
	}

	private async doRefresh(options?: RefreshOptions): Promise<TokenData> {
		if (!this.underlying.refreshIfNeeded) {
			throw new SchwabAuthError(
				AuthErrorCode.UNKNOWN,
				'Underlying token manager does not implement refreshIfNeeded',
				undefined,
				{ manager: this.underlying.constructor.name },
			)
		}

		try {
			// Pass through the options to the underlying manager
			const tokenData = await this.underlying.refreshIfNeeded(options)

			// Notify all listeners
			this.notifyRefreshListeners(tokenData)

			return tokenData
		} catch (error) {
			// Convert to SchwabAuthError if it's not already one
			if (error instanceof SchwabAuthError) {
				throw error
			}

			const errorMessage =
				error instanceof Error ? error.message : String(error)
			const authError = new SchwabAuthError(
				AuthErrorCode.REFRESH_NEEDED,
				`ConcurrentTokenManager: Failed to refresh tokens: ${errorMessage}`,
				undefined,
				{ originalError: error },
			)

			if (error instanceof Error) {
				authError.originalError = error
			}

			throw authError
		}
	}

	private notifyRefreshListeners(tokenData: TokenData): void {
		const failedCallbacks: Array<{ index: number; error: unknown }> = []

		for (let i = 0; i < this.refreshCallbacks.length; i++) {
			const callback = this.refreshCallbacks[i]
			try {
				callback?.(tokenData)
			} catch (callbackError) {
				// Collect errors but don't throw - callbacks shouldn't break the refresh process
				failedCallbacks.push({
					index: i,
					error: callbackError,
				})
			}
		}

		// Log all errors together with better context if any callbacks failed
		if (failedCallbacks.length > 0) {
			const errorContext = `${failedCallbacks.length} of ${this.refreshCallbacks.length} token refresh callbacks failed`
			const firstError = failedCallbacks[0]?.error

			// Create a detailed error object but don't throw it - just log for debugging
			const error = new SchwabError(
				`${errorContext}. First error: ${firstError instanceof Error ? firstError.message : String(firstError)}`,
			)
			error.originalError = {
				failedCallbacks: failedCallbacks.map((f) => ({
					callbackIndex: f.index,
					error:
						f.error instanceof Error
							? { message: f.error.message, stack: f.error.stack }
							: String(f.error),
				})),
			}

			console.error('Token refresh callback errors:', error)
		}
	}
}

/**
 * A unified function to build a token manager from various input types.
 * This is the recommended way to create token managers as it handles all
 * edge cases and automatically applies concurrency protection when needed.
 *
 * @param input The token input, which can be:
 *   - A string containing a static access token
 *   - An existing ITokenLifecycleManager instance
 *   - null/undefined (returns undefined)
 * @param options Optional configuration options
 * @returns A token manager instance, or undefined if input is null/undefined
 */
export function buildTokenManager(
	input: unknown,
	options?: TokenManagerOptions,
): ITokenLifecycleManager | undefined {
	// Handle null/undefined case
	if (!input) return undefined

	// Already a token manager - always wrap in ConcurrentTokenManager if it supports refresh
	if (isTokenLifecycleManager(input)) {
		// If the manager supports refresh, always wrap it for concurrency protection
		if (input.supportsRefresh()) {
			// Skip double-wrapping if it's already a ConcurrentTokenManager
			if (input instanceof ConcurrentTokenManager) {
				return input
			}
			return new ConcurrentTokenManager(input, options)
		}
		return input
	}

	// String token - create a static manager (no concurrency needed as it doesn't support refresh)
	if (typeof input === 'string') {
		return createStaticTokenManager(input)
	}

	// Unsupported input type
	throw new SchwabAuthError(
		AuthErrorCode.INVALID_CODE,
		'Unsupported token type. Must be a string or ITokenLifecycleManager instance.',
		undefined,
		{
			providedType: typeof input,
			providedValue: input === null ? 'null' : String(input),
		},
	)
}

/**
 * Forcibly refreshes the tokens managed by a token lifecycle manager.
 * This is useful when you need to explicitly trigger a refresh regardless of token expiration.
 *
 * @param manager The token lifecycle manager to refresh tokens for
 * @param options Optional refresh options
 * @returns The refreshed token data
 * @throws Error if the manager doesn't support refresh
 */
export async function forceRefreshTokens(
	manager: ITokenLifecycleManager,
	options?: RefreshOptions,
): Promise<TokenData> {
	// Validate that manager supports refresh
	if (!manager.supportsRefresh() || !manager.refreshIfNeeded) {
		throw new SchwabAuthError(
			AuthErrorCode.UNKNOWN,
			'This token manager does not support refresh operations',
			undefined,
			{ manager: manager.constructor.name },
		)
	}

	// Force refresh by setting force flag to true
	return manager.refreshIfNeeded({
		...options,
		force: true,
	})
}

/**
 * Retrieves the current access token, refreshing it if needed.
 * This is a helper function to simplify token retrieval when you just need the access token.
 *
 * @param manager The token lifecycle manager to get the token from
 * @param options Optional refresh options
 * @returns The current access token, or null if not available
 */
export async function getCurrentAccessToken(
	manager: ITokenLifecycleManager,
): Promise<string | null> {
	// Try to get the token using the manager's getAccessToken method
	if (
		'getAccessToken' in manager &&
		typeof manager.getAccessToken === 'function'
	) {
		return manager.getAccessToken()
	}

	// Fall back to getTokenData if getAccessToken is not implemented
	const tokenData = await manager.getTokenData()
	return tokenData ? tokenData.accessToken : null
}

// Re-export types from the types module for convenience
export type {
	TokenData,
	ITokenLifecycleManager,
	TokenManagerOptions,
	RefreshOptions,
}
