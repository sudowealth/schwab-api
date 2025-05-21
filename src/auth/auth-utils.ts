import { type TokenData, type TokenSet } from './types'

/**
 * Default refresh threshold: 5 minutes (300,000 ms)
 * This is the default time before token expiration when a refresh should be triggered
 */
export const DEFAULT_REFRESH_THRESHOLD_MS = 300_000 // 5 minutes

/**
 * Schwab refresh token expiration: 7 days (604,800,000 ms)
 * Schwab refresh tokens expire after 7 days of inactivity
 */
export const REFRESH_TOKEN_EXPIRATION_MS = 604_800_000 // 7 days

/**
 * Schwab refresh token warning threshold: 6 days (518,400,000 ms)
 * We warn about refresh token expiration when it's 6 days old (1 day before expiry)
 */
export const REFRESH_TOKEN_WARNING_THRESHOLD_MS = 518_400_000 // 6 days

/**
 * Check if an access token is nearing expiration and needs refreshing
 * @param expiresAt Timestamp when the token expires
 * @param refreshThresholdMs Time before expiration to trigger refresh (default: 5 minutes)
 * @returns True if token should be refreshed
 */
export function isAccessTokenNearingExpiration(
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
export function isRefreshTokenNearingExpiration(
	refreshTokenCreatedAt?: number,
): boolean {
	if (!refreshTokenCreatedAt) return false

	// Check if refresh token is older than 6 days
	return Date.now() - refreshTokenCreatedAt > REFRESH_TOKEN_WARNING_THRESHOLD_MS
}

/**
 * Unified method to check if any token is approaching expiration
 * Can be used for both access tokens and refresh tokens with appropriate parameters
 *
 * @param expirationTime The timestamp to check against, or undefined
 * @param thresholdMs Time threshold before expiration to return true
 * @returns True if the token is expiring within the threshold window
 */
export function tokenIsExpiringSoon(
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
 * @param refreshThresholdMs Time before expiration to trigger refresh
 * @returns True if tokens should be refreshed
 */
export function shouldRefreshTokens(
        tokens: TokenData | TokenSet | null | undefined,
        refreshThresholdMs: number = DEFAULT_REFRESH_THRESHOLD_MS,
): boolean {
	// No tokens available
	if (!tokens) return false

	// Get expiresAt from either TokenData or TokenSet
	const expiresAt = 'expiresAt' in tokens ? tokens.expiresAt : undefined

	// If token is expiring soon or already expired
	return tokenIsExpiringSoon(expiresAt, refreshThresholdMs)
}

/**
 * Creates a proper Authorization header value from token data
 *
 * @param tokenData TokenData object containing the access token
 * @returns Authorization header value or null if no valid token is available
 */
export function createAuthHeaderFromToken(
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
export function validateAuthorizationHeader(
	headerValue: string | null | undefined,
): {
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
