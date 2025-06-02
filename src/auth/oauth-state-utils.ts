import { z, type ZodSchema } from 'zod'
import { createLogger } from '../utils/secure-logger'
import { safeBase64Encode, safeBase64Decode } from './auth-utils'

const logger = createLogger('OAuthState')

/**
 * Configuration options for OAuth state handling
 */
export interface OAuthStateOptions {
	/**
	 * Whether to base64 encode the state
	 * @default true
	 */
	encode?: boolean

	/**
	 * Include a timestamp in the state
	 * @default false
	 */
	includeTimestamp?: boolean

	/**
	 * Additional data to merge into the state
	 */
	additionalData?: Record<string, any>

	/**
	 * Maximum age of the state in milliseconds
	 * @default 600000 (10 minutes)
	 */
	maxAge?: number
}

/**
 * OAuth state with optional timestamp
 */
export interface OAuthState<T = any> {
	/**
	 * The actual state data
	 */
	data: T

	/**
	 * Timestamp when the state was created
	 */
	timestamp?: number

	/**
	 * Any additional metadata
	 */
	metadata?: Record<string, any>
}

/**
 * Default options for OAuth state handling
 */
const DEFAULT_OPTIONS: Required<OAuthStateOptions> = {
	encode: true,
	includeTimestamp: false,
	additionalData: {},
	maxAge: 600000, // 10 minutes
}

/**
 * Encode OAuth state data for use in authorization URLs
 *
 * @param state The state data to encode
 * @param options Encoding options
 * @returns Encoded state string
 *
 * @example
 * ```typescript
 * const state = encodeOAuthState({
 *   clientId: 'my-client',
 *   returnUrl: '/dashboard'
 * });
 * // Returns base64 encoded string
 * ```
 */
export function encodeOAuthState<T = any>(
	state: T,
	options: OAuthStateOptions = {},
): string {
	const opts = { ...DEFAULT_OPTIONS, ...options }

	try {
		// Build the state object
		const stateObj: OAuthState<T> = {
			data: state,
			...(opts.includeTimestamp && { timestamp: Date.now() }),
			...(opts.additionalData &&
				Object.keys(opts.additionalData).length > 0 && {
					metadata: opts.additionalData,
				}),
		}

		// Convert to JSON
		const jsonString = JSON.stringify(stateObj)

		// Optionally encode
		if (opts.encode) {
			return safeBase64Encode(jsonString)
		}

		return jsonString
	} catch (error) {
		logger.error('Failed to encode OAuth state', error)
		throw new Error('Failed to encode OAuth state')
	}
}

/**
 * Decode OAuth state from an encoded string
 *
 * @param encodedState The encoded state string
 * @param options Decoding options
 * @returns Decoded state data or null if invalid
 *
 * @example
 * ```typescript
 * const state = decodeOAuthState<MyStateType>(encodedStateString);
 * if (state) {
 *   console.log(state.clientId);
 * }
 * ```
 */
export function decodeOAuthState<T = any>(
	encodedState: string,
	options: Pick<OAuthStateOptions, 'encode' | 'maxAge'> = {},
): T | null {
	const opts = {
		encode: DEFAULT_OPTIONS.encode,
		maxAge: DEFAULT_OPTIONS.maxAge,
		...options,
	}

	try {
		// Handle URL decoding if needed
		let processedState = encodedState
		if (encodedState.includes('%')) {
			try {
				processedState = decodeURIComponent(encodedState)
			} catch {
				// If URL decoding fails, continue with original
				logger.debug('URL decoding failed, using original state')
			}
		}

		// Decode from base64 if needed
		let jsonString: string
		if (opts.encode) {
			jsonString = safeBase64Decode(processedState)
		} else {
			jsonString = processedState
		}

		// Parse JSON
		const stateObj = JSON.parse(jsonString) as OAuthState<T>

		// Check timestamp if present
		if (stateObj.timestamp && opts.maxAge) {
			const age = Date.now() - stateObj.timestamp
			if (age > opts.maxAge) {
				logger.warn('OAuth state expired', { age, maxAge: opts.maxAge })
				return null
			}
		}

		// Return just the data portion
		return stateObj.data
	} catch (error) {
		logger.debug('Failed to decode OAuth state', error)
		return null
	}
}

/**
 * Validate OAuth state against a Zod schema
 *
 * @param state The state to validate
 * @param schema The Zod schema to validate against
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * const stateSchema = z.object({
 *   clientId: z.string(),
 *   returnUrl: z.string().url()
 * });
 *
 * if (validateOAuthState(state, stateSchema)) {
 *   // State is valid
 * }
 * ```
 */
export function validateOAuthState(state: any, schema?: ZodSchema): boolean {
	if (!state) {
		return false
	}

	if (!schema) {
		// Basic validation - must be an object
		return typeof state === 'object' && state !== null
	}

	try {
		schema.parse(state)
		return true
	} catch (error) {
		logger.debug('OAuth state validation failed', error)
		return false
	}
}

/**
 * Merge application state with PKCE data
 * This is useful for OAuth flows that need to include PKCE parameters
 *
 * @param appState Application-specific state
 * @param pkceData PKCE code verifier
 * @returns Encoded state string containing both
 *
 * @example
 * ```typescript
 * const state = mergeStateWithPKCE(
 *   { returnUrl: '/dashboard' },
 *   { code_verifier: 'generated_verifier' }
 * );
 * ```
 */
export function mergeStateWithPKCE(
	appState: any,
	pkceData: { code_verifier: string },
): string {
	const mergedState = {
		...appState,
		pkce_code_verifier: pkceData.code_verifier,
	}

	return encodeOAuthState(mergedState, { encode: true })
}

/**
 * Extract PKCE data from OAuth state
 *
 * @param encodedState The encoded state containing PKCE data
 * @returns Object containing the code verifier and remaining app state
 *
 * @example
 * ```typescript
 * const { code_verifier, appState } = extractPKCEFromState(encodedState);
 * if (code_verifier) {
 *   // Use for token exchange
 * }
 * ```
 */
export function extractPKCEFromState(encodedState: string): {
	code_verifier?: string
	appState: any
} {
	const fullState = decodeOAuthState(encodedState)

	if (!fullState || typeof fullState !== 'object') {
		return { appState: fullState }
	}

	// Extract PKCE fields
	const { pkce_code_verifier, ...appState } = fullState as any

	return {
		code_verifier: pkce_code_verifier,
		appState,
	}
}

/**
 * Create a state parameter with built-in CSRF protection
 *
 * @param state The state data
 * @param csrfToken Optional CSRF token (generated if not provided)
 * @returns Encoded state with CSRF token
 */
export function createStateWithCSRF<T = any>(
	state: T,
	csrfToken?: string,
): { encodedState: string; csrfToken: string } {
	// Generate CSRF token if not provided
	const token = csrfToken || generateCSRFToken()

	const stateWithCSRF = {
		...state,
		csrf: token,
	}

	return {
		encodedState: encodeOAuthState(stateWithCSRF),
		csrfToken: token,
	}
}

/**
 * Verify state with CSRF protection
 *
 * @param encodedState The encoded state to verify
 * @param expectedCSRF The expected CSRF token
 * @returns The state data if valid, null otherwise
 */
export function verifyStateWithCSRF<T = any>(
	encodedState: string,
	expectedCSRF: string,
): T | null {
	const fullState = decodeOAuthState(encodedState) as any

	if (!fullState || typeof fullState !== 'object') {
		return null
	}

	const { csrf, ...state } = fullState

	if (csrf !== expectedCSRF) {
		logger.warn('CSRF token mismatch in OAuth state')
		return null
	}

	return state as T
}

/**
 * Generate a CSRF token
 * Simple implementation - for production use, consider a cryptographically secure method
 */
function generateCSRFToken(): string {
	const array = new Uint8Array(32)
	crypto.getRandomValues(array)
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	)
}

/**
 * Schema for basic OAuth state validation
 */
export const BasicOAuthStateSchema = z.object({
	clientId: z.string().optional(),
	redirectUri: z.string().optional(),
	scope: z.array(z.string()).optional(),
	state: z.string().optional(),
})

/**
 * Schema for PKCE-enhanced OAuth state
 */
export const PKCEOAuthStateSchema = BasicOAuthStateSchema.extend({
	pkce_code_verifier: z.string().optional(),
	code_challenge: z.string().optional(),
	code_challenge_method: z.enum(['S256', 'plain']).optional(),
})
