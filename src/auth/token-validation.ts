/**
 * Centralized token validation utilities
 */

import { type TokenData } from './types.js'

/**
 * Token validation result with detailed information
 */
export interface TokenValidationResult {
	valid: boolean
	reason?: string
	canRefresh?: boolean
	isExpiring?: boolean
	expiresInSeconds?: number
	format?: {
		isValid: boolean
		issues?: string[]
	}
}

/**
 * Validate TokenData (partial token information)
 * This handles cases where refresh token or expiration might be optional
 */
export function validateTokenData(tokenData: TokenData): boolean {
	// Basic validation
	if (!tokenData || typeof tokenData !== 'object') {
		return false
	}

	// Access token is always required
	if (!tokenData.accessToken || typeof tokenData.accessToken !== 'string') {
		return false
	}

	// If expiresAt is provided, it must be valid
	if (
		tokenData.expiresAt !== undefined &&
		(typeof tokenData.expiresAt !== 'number' || tokenData.expiresAt <= 0)
	) {
		return false
	}

	// If refreshToken is provided, it must be a string
	if (
		tokenData.refreshToken !== undefined &&
		typeof tokenData.refreshToken !== 'string'
	) {
		return false
	}

	return true
}

/**
 * Perform detailed validation with comprehensive reporting
 * @param tokenData The token data to validate
 * @param refreshThresholdMs Time before expiration to consider token as expiring (default: 5 minutes)
 * @returns Detailed validation result
 */
export function validateTokenDetailed(
	tokenData: TokenData,
	refreshThresholdMs = 300_000,
): TokenValidationResult {
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
	const isExpiring = expiresInMs <= refreshThresholdMs

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

/**
 * Check if a token is expired or expiring soon
 * @param expiresAt The expiration timestamp
 * @param thresholdMs Time before expiration to consider token as expiring
 */
export function isTokenExpiring(
	expiresAt?: number,
	thresholdMs = 300_000,
): boolean {
	if (!expiresAt) return true
	return expiresAt <= Date.now() + thresholdMs
}

/**
 * Ensure TokenData has all required fields with defaults
 */
export function ensureCompleteTokenData(
	tokenData: Partial<TokenData>,
	defaultExpiresInSeconds = 3600,
): Required<TokenData> {
	return {
		accessToken: tokenData.accessToken || '',
		refreshToken: tokenData.refreshToken || '',
		expiresAt:
			tokenData.expiresAt || Date.now() + defaultExpiresInSeconds * 1000,
	}
}
