import { tokenIsExpiringSoon } from './auth-utils'
import {
	type ITokenLifecycleManager,
	forceRefreshTokens,
} from './token-lifecycle-manager'
import { type TokenData } from './types'

/**
 * Options for the auth diagnostics function
 */
export interface AuthDiagnosticsOptions {
	/**
	 * Force refresh the tokens before returning the diagnostics
	 * @default false
	 */
	forceRefresh?: boolean

	/**
	 * Return the full tokens (only for diagnostic purposes, handle with care)
	 * @default false
	 */
	includeTokens?: boolean

	/**
	 * Include token segments (first 8 chars) for debugging without exposing full tokens
	 * @default true
	 */
	includeTokenSegments?: boolean
}

/**
 * Authentication diagnostics result
 */
export interface AuthDiagnosticsResult {
	/**
	 * Type of auth manager being used
	 */
	authManagerType: string

	/**
	 * Whether the auth manager supports token refresh
	 */
	supportsRefresh: boolean

	/**
	 * Detailed token status information
	 */
	tokenStatus: {
		/**
		 * Whether an access token is present
		 */
		hasAccessToken: boolean

		/**
		 * Whether a refresh token is present
		 */
		hasRefreshToken: boolean

		/**
		 * Whether the token is expired
		 */
		isExpired: boolean

		/**
		 * Time in milliseconds until token expires
		 * Negative value means the token is already expired
		 */
		expiresInMs?: number

		/**
		 * Time in seconds until token expires (for human readability)
		 */
		expiresInSeconds?: number

		/**
		 * Whether a refresh was successfully performed
		 */
		refreshSuccessful?: boolean

		/**
		 * New expiration time after refresh
		 */
		newExpiresAt?: number

		/**
		 * First 8 characters of the access token (for debugging)
		 */
		accessTokenSegment?: string

		/**
		 * First 8 characters of the refresh token (for debugging)
		 */
		refreshTokenSegment?: string

		/**
		 * Full token details (only returned if includeTokens is true)
		 * WARNING: This contains sensitive information!
		 */
		tokens?: TokenData
	}

	/**
	 * Detailed environment information
	 */
	environment: {
		/**
		 * API environment (sandbox or production)
		 */
		apiEnvironment: string

		/**
		 * Client ID (first 8 characters)
		 */
		clientIdSegment?: string
	}
}

/**
 * Diagnostic function to get detailed information about authentication state
 * Helps troubleshoot 401 Unauthorized errors by providing token status details
 *
 * @param tokenManager The token lifecycle manager to diagnose
 * @param options Options for diagnostics
 * @returns Detailed diagnostics information
 */
export async function getAuthDiagnostics(
	tokenManager: ITokenLifecycleManager,
	environment: {
		apiEnvironment: string
		clientId?: string
	},
	options: AuthDiagnosticsOptions = {},
): Promise<AuthDiagnosticsResult> {
	const {
		forceRefresh = false,
		includeTokens = false,
		includeTokenSegments = true,
	} = options

	// Get the current token status
	const tokenData = await tokenManager.getTokenData()

	// Check if the token manager supports refresh
	const supportsRefresh = tokenManager.supportsRefresh()

	// Extract basic token status
	const hasAccessToken = !!tokenData?.accessToken
	const hasRefreshToken = !!tokenData?.refreshToken
	const isExpired = tokenData?.expiresAt
		? tokenData.expiresAt <= Date.now()
		: false

	// Calculate time until expiration
	const expiresInMs = tokenData?.expiresAt
		? tokenData.expiresAt - Date.now()
		: undefined
	const expiresInSeconds =
		expiresInMs !== undefined ? Math.floor(expiresInMs / 1000) : undefined

	// Base diagnostic result
	const result: AuthDiagnosticsResult = {
		authManagerType: tokenManager.constructor.name,
		supportsRefresh,
		tokenStatus: {
			hasAccessToken,
			hasRefreshToken,
			isExpired,
			expiresInMs,
			expiresInSeconds,
		},
		environment: {
			apiEnvironment: environment.apiEnvironment,
		},
	}

	// Add token segments for debugging (first 8 characters)
	if (includeTokenSegments && tokenData) {
		if (tokenData.accessToken) {
			result.tokenStatus.accessTokenSegment = tokenData.accessToken.substring(
				0,
				8,
			)
		}

		if (tokenData.refreshToken) {
			result.tokenStatus.refreshTokenSegment = tokenData.refreshToken.substring(
				0,
				8,
			)
		}
	}

	// Add client ID segment if available
	if (environment.clientId) {
		result.environment.clientIdSegment = environment.clientId.substring(0, 8)
	}

	// Include full tokens if requested (only for diagnostic purposes!)
	if (includeTokens) {
		result.tokenStatus.tokens = tokenData ?? undefined
	}

	// Force refresh if requested and the token manager supports it
	if (forceRefresh && supportsRefresh && tokenManager.refreshIfNeeded) {
		try {
			// Attempt to force refresh the tokens
			const refreshedTokens = await forceRefreshTokens(tokenManager)

			// Update the diagnostic result with refresh information
			result.tokenStatus.refreshSuccessful = true
			result.tokenStatus.newExpiresAt = refreshedTokens.expiresAt

			// Update token segments after refresh
			if (includeTokenSegments) {
				if (refreshedTokens.accessToken) {
					result.tokenStatus.accessTokenSegment =
						refreshedTokens.accessToken.substring(0, 8)
				}

				if (refreshedTokens.refreshToken) {
					result.tokenStatus.refreshTokenSegment =
						refreshedTokens.refreshToken.substring(0, 8)
				}
			}

			// Update full tokens if requested
			if (includeTokens) {
				result.tokenStatus.tokens = refreshedTokens
			}
		} catch (error) {
			// Record that refresh failed
			result.tokenStatus.refreshSuccessful = false

			// Re-throw the error for proper handling
			throw error
		}
	}

	return result
}

/**
 * Create a debug log message with token status information
 * Useful for logging token state without exposing sensitive information
 *
 * @param tokenData The token data to debug log
 * @returns A safe string representation of token status for logging
 */
export function createTokenDebugLog(tokenData?: TokenData): string {
	if (!tokenData) {
		return 'No token data available'
	}

	// Construct safe debug info
	const info = {
		hasAccessToken: !!tokenData.accessToken,
		accessTokenLength: tokenData.accessToken?.length ?? 0,
		hasRefreshToken: !!tokenData.refreshToken,
		refreshTokenLength: tokenData.refreshToken?.length ?? 0,
		expiresAt: tokenData.expiresAt,
		expiresIn: tokenData.expiresAt
			? `${Math.floor((tokenData.expiresAt - Date.now()) / 1000)}s`
			: 'unknown',
		isExpired: tokenData.expiresAt
			? tokenData.expiresAt <= Date.now()
			: 'unknown',
		isExpiringSoon: tokenData.expiresAt
			? tokenIsExpiringSoon(tokenData.expiresAt)
			: false,
	}

	return JSON.stringify(info)
}
