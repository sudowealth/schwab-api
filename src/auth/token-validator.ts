import { type TokenData } from './types'

/**
 * Token validation result
 */
export interface TokenValidationResult {
	/**
	 * Whether the token is valid for API requests
	 */
	isValid: boolean

	/**
	 * Reason why the token is invalid, if applicable
	 */
	reason?: string

	/**
	 * Whether the token is close to expiry
	 */
	isExpiring?: boolean

	/**
	 * Expiration time in seconds
	 */
	expiresInSeconds?: number

	/**
	 * Format validation results
	 */
	format?: {
		/**
		 * Whether the tokens have the expected format
		 */
		isValid: boolean

		/**
		 * Format issues found
		 */
		issues?: string[]
	}
}

/**
 * Options for token validation
 */
export interface TokenValidationOptions {
	/**
	 * Time in seconds before expiration to consider a token as expiring
	 * @default 300 (5 minutes)
	 */
	expiringThresholdSeconds?: number

	/**
	 * Whether to validate token format
	 * @default true
	 */
	validateFormat?: boolean

	/**
	 * Minimum expected length for access tokens
	 * @default 20
	 */
	minAccessTokenLength?: number

	/**
	 * Minimum expected length for refresh tokens
	 * @default 20
	 */
	minRefreshTokenLength?: number
}

/**
 * Validates a token to ensure it's usable for API requests
 *
 * @param tokenData TokenData object to validate
 * @param options Validation options
 * @returns Validation result with details
 */
export function validateToken(
	tokenData: TokenData | null | undefined,
	options: TokenValidationOptions = {},
): TokenValidationResult {
	// Default options
	const {
		expiringThresholdSeconds = 300,
		validateFormat = true,
		minAccessTokenLength = 20,
		minRefreshTokenLength = 20,
	} = options

	// If no token data is provided, it's invalid
	if (!tokenData) {
		return {
			isValid: false,
			reason: 'No token data provided',
		}
	}

	// Check for missing access token
	if (!tokenData.accessToken) {
		return {
			isValid: false,
			reason: 'Missing access token',
		}
	}

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
				isValid: false,
				reason: `Token expired ${Math.abs(expiresInSeconds)} seconds ago`,
				expiresInSeconds,
				format: {
					isValid: formatIssues.length === 0,
					issues: formatIssues.length > 0 ? formatIssues : undefined,
				},
			}
		}

		// If token is close to expiry
		const isExpiring = expiresInMs <= expiringThresholdSeconds * 1000

		// Token is valid with potential format issues
		return {
			isValid: true,
			isExpiring,
			expiresInSeconds,
			format: {
				isValid: formatIssues.length === 0,
				issues: formatIssues.length > 0 ? formatIssues : undefined,
			},
		}
	}

	// No expiration time but token exists - technically valid but risky
	return {
		isValid: true,
		reason: 'No expiration time provided, token validity cannot be determined',
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
export function validateTokenForEndpoint(
	tokenData: TokenData | null | undefined,
	targetUrl: string,
	options: TokenValidationOptions = {},
): TokenValidationResult {
	// First perform basic token validation
	const baseValidation = validateToken(tokenData, options)

	// If the base validation already failed, return that result
	if (!baseValidation.isValid) {
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
				isValid: false,
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
