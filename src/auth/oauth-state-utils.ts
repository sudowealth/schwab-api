import { z, type ZodSchema } from 'zod'
import { createLogger } from '../utils/secure-logger.js'
import { safeBase64Encode, safeBase64Decode } from './auth-utils.js'

const logger = createLogger('OAuthState')

/**
 * Base OAuth state schema for PKCE flow
 */
export const BasicOAuthStateSchema = z.object({
	pkce_code_verifier: z.string().optional(),
	csrf_token: z.string().optional(),
	timestamp: z.number().optional(),
})

/**
 * Extended OAuth state schema with PKCE support
 */
export const PKCEOAuthStateSchema = BasicOAuthStateSchema.extend({
	pkce_code_verifier: z.string(),
	pkce_code_challenge: z.string().optional(),
	pkce_method: z.literal('S256').optional(),
})

/**
 * Generic OAuth state type
 */
export type OAuthState = z.infer<typeof BasicOAuthStateSchema> & {
	[key: string]: any
}

/**
 * Options for OAuth state encoding/decoding
 */
export interface OAuthStateOptions {
	/**
	 * Include CSRF token for additional security
	 */
	includeCSRF?: boolean

	/**
	 * Include timestamp for state expiration checks
	 */
	includeTimestamp?: boolean

	/**
	 * Custom data to include in state
	 */
	customData?: Record<string, any>
}

/**
 * Encode OAuth state to a base64 string
 *
 * @param state State object to encode
 * @param options Encoding options
 * @returns Base64-encoded state string
 */
export function encodeOAuthState<T extends Record<string, any>>(
	state: T,
	options: OAuthStateOptions = {},
): string {
	try {
		const stateObject: OAuthState = {
			...state,
			...(options.customData || {}),
		}

		// Add CSRF token if requested
		if (options.includeCSRF && !stateObject.csrf_token) {
			stateObject.csrf_token = generateCSRFToken()
		}

		// Add timestamp if requested
		if (options.includeTimestamp && !stateObject.timestamp) {
			stateObject.timestamp = Date.now()
		}

		const jsonString = JSON.stringify(stateObject)
		return safeBase64Encode(jsonString, true) // URL-safe encoding
	} catch (error) {
		logger.error('Failed to encode OAuth state:', error)
		throw new Error('Failed to encode OAuth state')
	}
}

/**
 * Decode OAuth state from a base64 string
 *
 * @param encodedState Base64-encoded state string
 * @returns Decoded state object or null if decoding fails
 */
export function decodeOAuthState<T = OAuthState>(
	encodedState: string,
): T | null {
	try {
		// Handle URL-encoded state parameters
		let processedState = encodedState

		// Check if the state might be URL-encoded
		if (encodedState.includes('%')) {
			try {
				processedState = decodeURIComponent(encodedState)
				logger.debug('URL-decoded state parameter')
			} catch {
				logger.warn('Failed to URL-decode state parameter, using as-is')
			}
		}

		const jsonString = safeBase64Decode(processedState)
		const parsed = JSON.parse(jsonString)

		return parsed as T
	} catch (error) {
		logger.error('Failed to decode OAuth state:', error)
		return null
	}
}

/**
 * Validate OAuth state against a schema
 *
 * @param state State object to validate
 * @param schema Zod schema to validate against
 * @returns True if valid, false otherwise
 */
export function validateOAuthState<T>(
	state: unknown,
	schema: ZodSchema<T>,
): state is T {
	try {
		schema.parse(state)
		return true
	} catch (error) {
		logger.debug('OAuth state validation failed:', error)
		return false
	}
}

/**
 * Merge application state with PKCE parameters
 *
 * @param appState Application-specific state
 * @param pkceVerifier PKCE code verifier
 * @param pkceChallenge PKCE code challenge
 * @returns Merged state object
 */
export function mergeStateWithPKCE<T extends Record<string, any>>(
	appState: T,
	pkceVerifier: string,
	pkceChallenge?: string,
): T & { pkce_code_verifier: string; pkce_code_challenge?: string } {
	return {
		...appState,
		pkce_code_verifier: pkceVerifier,
		...(pkceChallenge && { pkce_code_challenge: pkceChallenge }),
	}
}

/**
 * Extract PKCE parameters from state
 *
 * @param state State object containing PKCE parameters
 * @returns PKCE parameters or null if not found
 */
export function extractPKCEFromState(
	state: unknown,
): { codeVerifier: string; codeChallenge?: string } | null {
	if (!state || typeof state !== 'object') {
		return null
	}

	const stateObj = state as any

	if (!stateObj.pkce_code_verifier) {
		return null
	}

	return {
		codeVerifier: stateObj.pkce_code_verifier,
		codeChallenge: stateObj.pkce_code_challenge,
	}
}

/**
 * Create OAuth state with CSRF token
 *
 * @param data State data
 * @returns State with CSRF token
 */
export function createStateWithCSRF<T extends Record<string, any>>(
	data: T,
): T & { csrf_token: string; timestamp: number } {
	return {
		...data,
		csrf_token: generateCSRFToken(),
		timestamp: Date.now(),
	}
}

/**
 * Verify OAuth state CSRF token and timestamp
 *
 * @param state State object to verify
 * @param expectedCSRF Expected CSRF token
 * @param maxAgeMs Maximum age in milliseconds (default: 10 minutes)
 * @returns True if valid, false otherwise
 */
export function verifyStateWithCSRF(
	state: unknown,
	expectedCSRF?: string,
	maxAgeMs = 600000, // 10 minutes
): boolean {
	if (!state || typeof state !== 'object') {
		return false
	}

	const stateObj = state as any

	// Verify CSRF token if provided
	if (expectedCSRF && stateObj.csrf_token !== expectedCSRF) {
		logger.warn('CSRF token mismatch in OAuth state')
		return false
	}

	// Verify timestamp if present
	if (stateObj.timestamp) {
		const age = Date.now() - stateObj.timestamp
		if (age > maxAgeMs) {
			logger.warn('OAuth state has expired')
			return false
		}
	}

	return true
}

/**
 * Generate a secure CSRF token
 *
 * @returns Random CSRF token
 */
function generateCSRFToken(): string {
	const array = new Uint8Array(32)
	crypto.getRandomValues(array)
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	)
}

/**
 * Extract client ID from various state formats
 * Supports both direct clientId and nested oauthReqInfo.clientId
 *
 * @param state State object
 * @returns Client ID or null if not found
 */
export function extractClientIdFromState(state: unknown): string | null {
	if (!state || typeof state !== 'object') {
		return null
	}

	const stateObj = state as any

	// Direct clientId
	if (stateObj.clientId && typeof stateObj.clientId === 'string') {
		return stateObj.clientId
	}

	// Nested in oauthReqInfo (MCP pattern)
	if (
		stateObj.oauthReqInfo &&
		typeof stateObj.oauthReqInfo === 'object' &&
		stateObj.oauthReqInfo.clientId &&
		typeof stateObj.oauthReqInfo.clientId === 'string'
	) {
		return stateObj.oauthReqInfo.clientId
	}

	// Nested in other common patterns
	if (
		stateObj.auth &&
		typeof stateObj.auth === 'object' &&
		stateObj.auth.clientId
	) {
		return stateObj.auth.clientId
	}

	return null
}

/**
 * Advanced state verification with custom validation
 *
 * @param encodedState Encoded state string
 * @param options Verification options
 * @returns Decoded and validated state or null
 */
export function decodeAndVerifyState<T = OAuthState>(
	encodedState: string,
	options: {
		schema?: ZodSchema<T>
		expectedCSRF?: string
		maxAgeMs?: number
		requiredFields?: string[]
	} = {},
): T | null {
	try {
		// Decode the state
		const decoded = decodeOAuthState<T>(encodedState)
		if (!decoded) {
			return null
		}

		// Validate against schema if provided
		if (options.schema && !validateOAuthState(decoded, options.schema)) {
			logger.error('State validation failed against provided schema')
			return null
		}

		// Verify CSRF if needed
		if (options.expectedCSRF || options.maxAgeMs) {
			if (
				!verifyStateWithCSRF(decoded, options.expectedCSRF, options.maxAgeMs)
			) {
				return null
			}
		}

		// Check required fields
		if (options.requiredFields) {
			const decodedObj = decoded as any
			for (const field of options.requiredFields) {
				if (!(field in decodedObj)) {
					logger.error(`Required field '${field}' missing in state`)
					return null
				}
			}
		}

		return decoded
	} catch (error) {
		logger.error('Error decoding and verifying state:', error)
		return null
	}
}
