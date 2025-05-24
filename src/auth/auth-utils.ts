import * as base64js from 'base64-js'

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
 * Sanitize authorization code for Schwab's OAuth requirements
 * This handles any encoding issues that might come up with special characters
 * and ensures base64 padding is correctly handled.
 *
 * Specifically addresses:
 * - Removing invalid base64 characters
 * - Converting from base64url to standard base64 format
 * - Adding proper padding to make length a multiple of 4
 * - Handling URL-encoded characters
 *
 * @param code The authorization code to sanitize
 * @param debug Optional flag to enable debug logging
 * @returns The sanitized authorization code
 */
export function sanitizeAuthCode(code: string, debug: boolean = false): string {
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

			if (debug) {
				console.log(
					`[sanitizeAuthCode] URL-decoded specific characters: '${trimmedCode.substring(0, 15)}...' => '${processedCode.substring(0, 15)}...'`,
				)
			}
		} catch (e) {
			// If specific URL decoding fails, preserve original code
			console.error(
				`[sanitizeAuthCode] Error handling URL-encoded characters: ${(e as Error).message}`,
			)
			processedCode = trimmedCode // Revert to original
		}
	}

	if (debug) {
		// Log if the code contains periods for debugging purposes
		if (processedCode.includes('.')) {
			console.log(
				`[sanitizeAuthCode] Code contains periods. Format preserved as: ${processedCode
					.split('.')
					.map((segment) => segment.substring(0, 5) + '...')
					.join('.')}`,
			)
		}

		console.log(
			`[sanitizeAuthCode] Minimal processing applied, preserving structure: '${processedCode.substring(0, 15)}...'`,
		)
	}

	return processedCode
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
 * Safe Base64 decoding using base64-js library
 * - Handles standard base64 and base64url formats
 * - Works consistently across Node.js and browser environments
 * - Provides improved error handling
 *
 * @param input The Base64 or Base64URL string to decode
 * @returns The decoded string
 */
export function safeBase64Decode(input: string): string {
	// Try URL-safe base64 first
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
	} catch {
		// Second chance: un-escape %xx sequences, then decode
		try {
			const cleaned = decodeURIComponent(input)
			// Try again with the cleaned input
			const needsUrlDecoding = cleaned.includes('-') || cleaned.includes('_')
			let base64 = cleaned

			if (needsUrlDecoding) {
				base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/')
			}

			let paddedBase64 = base64
			while (paddedBase64.length % 4 !== 0) {
				paddedBase64 += '='
			}

			const binaryData = base64js.toByteArray(paddedBase64)
			return new TextDecoder().decode(binaryData)
		} catch (error) {
			throw new Error(`Base64 decode error: ${(error as Error).message}`)
		}
	}
}

/**
 * Safe Base64 encoding using base64-js library
 * - Encodes strings to base64 with consistent behavior across environments
 * - Supports URL-safe base64 format (base64url)
 * - Enhanced error handling
 *
 * @param input The string to encode
 * @param urlSafe Whether to make the output URL-safe (default: true)
 * @returns The Base64 encoded string
 */
export function safeBase64Encode(input: string, urlSafe = true): string {
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
