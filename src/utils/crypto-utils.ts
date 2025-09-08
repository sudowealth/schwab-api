import { createLogger } from './secure-logger.js'

const logger = createLogger('CryptoUtils')

/**
 * Options for cryptographic operations
 */
export interface SigningOptions {
	/**
	 * Algorithm to use for signing
	 * @default 'HMAC'
	 */
	algorithm?: 'HMAC' | 'RSA'

	/**
	 * Output encoding format
	 * @default 'hex'
	 */
	encoding?: 'hex' | 'base64'

	/**
	 * Hash algorithm for HMAC
	 * @default 'SHA-256'
	 */
	hash?: 'SHA-256' | 'SHA-384' | 'SHA-512'
}

/**
 * Key validation options
 */
export interface KeyValidationOptions {
	/**
	 * Minimum key length in characters
	 * @default 32
	 */
	minLength?: number

	/**
	 * Minimum entropy (unique characters)
	 * @default 8
	 */
	minEntropy?: number

	/**
	 * Check for weak patterns
	 * @default true
	 */
	checkWeakPatterns?: boolean
}

/**
 * Default options for signing operations
 */
const DEFAULT_SIGNING_OPTIONS: Required<SigningOptions> = {
	algorithm: 'HMAC',
	encoding: 'hex',
	hash: 'SHA-256',
}

/**
 * Create an HMAC key from a secret string
 *
 * @param secret The secret key string
 * @param options Validation options
 * @returns A CryptoKey for HMAC operations
 * @throws Error if the secret doesn't meet security requirements
 *
 * @example
 * ```typescript
 * const key = await createHmacKey('your-secret-key-at-least-32-chars');
 * ```
 */
export async function createHmacKey(
	secret: string,
	options: KeyValidationOptions = {},
): Promise<CryptoKey> {
	const opts = {
		minLength: 32,
		minEntropy: 8,
		checkWeakPatterns: true,
		...options,
	}

	// Validate secret
	if (!secret) {
		throw new Error('Secret key is required')
	}

	if (secret.length < opts.minLength) {
		throw new Error(
			`Secret key must be at least ${opts.minLength} characters long for security`,
		)
	}

	// Check entropy
	const uniqueChars = new Set(secret).size
	if (uniqueChars < opts.minEntropy) {
		throw new Error(
			`Secret key must have at least ${opts.minEntropy} unique characters for sufficient entropy`,
		)
	}

	// Check for weak patterns
	if (opts.checkWeakPatterns) {
		const weakPatterns = [
			/^(.)\1*$/, // All same character
			/^(01|10)+$/, // Binary pattern
			/^(abc|123)+$/i, // Sequential pattern
			/^(password|secret|key)/i, // Common weak prefixes
		]

		for (const pattern of weakPatterns) {
			if (pattern.test(secret)) {
				throw new Error(
					'Secret key appears to use a weak pattern. Use a cryptographically secure random string.',
				)
			}
		}
	}

	// Import the key
	const encoder = new TextEncoder()
	const keyData = encoder.encode(secret)

	return crypto.subtle.importKey(
		'raw',
		keyData,
		{
			name: 'HMAC',
			hash: 'SHA-256',
		},
		false, // not extractable
		['sign', 'verify'],
	)
}

/**
 * Sign data using HMAC or RSA
 *
 * @param key The CryptoKey to use for signing
 * @param data The data to sign
 * @param options Signing options
 * @returns The signature as a hex or base64 string
 *
 * @example
 * ```typescript
 * const signature = await signData(key, 'data-to-sign');
 * ```
 */
export async function signData(
	key: CryptoKey,
	data: string,
	options: SigningOptions = {},
): Promise<string> {
	const opts = { ...DEFAULT_SIGNING_OPTIONS, ...options }

	try {
		const encoder = new TextEncoder()
		const dataBuffer = encoder.encode(data)

		let signatureBuffer: ArrayBuffer

		if (opts.algorithm === 'HMAC') {
			signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer)
		} else if (opts.algorithm === 'RSA') {
			signatureBuffer = await crypto.subtle.sign(
				{
					name: 'RSA-PSS',
					saltLength: 32,
				},
				key,
				dataBuffer,
			)
		} else {
			throw new Error(`Unsupported algorithm: ${opts.algorithm}`)
		}

		// Encode the signature
		if (opts.encoding === 'hex') {
			return toHex(signatureBuffer)
		} else if (opts.encoding === 'base64') {
			return bufferToBase64(signatureBuffer)
		} else {
			throw new Error(`Unsupported encoding: ${opts.encoding}`)
		}
	} catch (error) {
		logger.error('Error signing data', error)
		throw new Error('Failed to sign data')
	}
}

/**
 * Verify a signature using HMAC or RSA
 *
 * @param key The CryptoKey to use for verification
 * @param signature The signature to verify
 * @param data The original data that was signed
 * @param options Signing options (must match those used for signing)
 * @returns True if the signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifySignature(key, signature, 'data-to-sign');
 * ```
 */
export async function verifySignature(
	key: CryptoKey,
	signature: string,
	data: string,
	options: SigningOptions = {},
): Promise<boolean> {
	const opts = { ...DEFAULT_SIGNING_OPTIONS, ...options }

	try {
		const encoder = new TextEncoder()
		const dataBuffer = encoder.encode(data)

		// Decode the signature
		let signatureBuffer: ArrayBuffer

		if (opts.encoding === 'hex') {
			signatureBuffer = fromHex(signature)
		} else if (opts.encoding === 'base64') {
			signatureBuffer = base64ToBuffer(signature)
		} else {
			throw new Error(`Unsupported encoding: ${opts.encoding}`)
		}

		if (opts.algorithm === 'HMAC') {
			return await crypto.subtle.verify(
				'HMAC',
				key,
				signatureBuffer,
				dataBuffer,
			)
		} else if (opts.algorithm === 'RSA') {
			return await crypto.subtle.verify(
				{
					name: 'RSA-PSS',
					saltLength: 32,
				},
				key,
				signatureBuffer,
				dataBuffer,
			)
		} else {
			throw new Error(`Unsupported algorithm: ${opts.algorithm}`)
		}
	} catch (error) {
		logger.debug('Error verifying signature', error)
		return false
	}
}

/**
 * Convert an ArrayBuffer to a hexadecimal string
 *
 * @param buffer The buffer to convert
 * @returns Hex string representation
 */
export function toHex(buffer: ArrayBuffer): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		return Buffer.from(buffer).toString('hex')
	} else {
		// Browser environment
		const bytes = new Uint8Array(buffer)
		return Array.from(bytes)
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('')
	}
}

/**
 * Convert a hexadecimal string to an ArrayBuffer
 *
 * @param hex The hex string to convert
 * @returns ArrayBuffer representation
 * @throws Error if the hex string is invalid
 */
export function fromHex(hex: string): ArrayBuffer {
	// Remove any spaces or non-hex characters
	const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '')

	if (cleanHex.length % 2 !== 0) {
		throw new Error('Invalid hex string: odd number of characters')
	}

	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		try {
			return Buffer.from(cleanHex, 'hex').buffer
		} catch {
			throw new Error('Invalid hex string format')
		}
	} else {
		// Browser environment
		const bytes = new Uint8Array(cleanHex.length / 2)
		for (let i = 0; i < cleanHex.length; i += 2) {
			const byte = Number.parseInt(cleanHex.substr(i, 2), 16)
			if (Number.isNaN(byte)) {
				throw new Error(`Invalid hex string at position ${i}`)
			}
			bytes[i / 2] = byte
		}
		return bytes.buffer
	}
}

/**
 * Convert an ArrayBuffer to base64
 *
 * @param buffer The buffer to convert
 * @returns Base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		return Buffer.from(buffer).toString('base64')
	} else {
		// Browser environment
		const bytes = new Uint8Array(buffer)
		let binary = ''
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]!)
		}
		return btoa(binary)
	}
}

/**
 * Convert a base64 string to ArrayBuffer
 *
 * @param base64 The base64 string to convert
 * @returns ArrayBuffer
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		return Buffer.from(base64, 'base64').buffer
	} else {
		// Browser environment
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i)
		}
		return bytes.buffer
	}
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a First string
 * @param b Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false
	}

	let result = 0
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i)
	}

	return result === 0
}

/**
 * Generate a cryptographically secure random string
 *
 * @param length The length of the string to generate
 * @param charset The character set to use
 * @returns Random string
 */
export function generateSecureRandomString(
	length: number,
	charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
	const values = new Uint32Array(length)
	crypto.getRandomValues(values)

	let result = ''
	for (let i = 0; i < length; i++) {
		result += charset[values[i]! % charset.length]
	}

	return result
}

/**
 * Hash data using SHA-256 or other algorithms
 *
 * @param data The data to hash
 * @param algorithm The hash algorithm to use
 * @returns Hex-encoded hash
 */
export async function hashData(
	data: string,
	algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<string> {
	const encoder = new TextEncoder()
	const dataBuffer = encoder.encode(data)

	const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer)
	return toHex(hashBuffer)
}

/**
 * Create a time-based signature with expiration
 *
 * @param key The signing key
 * @param data The data to sign
 * @param expiresIn Expiration time in seconds
 * @returns Signature with timestamp
 */
export async function createTimedSignature(
	key: CryptoKey,
	data: string,
	expiresIn = 300, // 5 minutes default
): Promise<{ signature: string; expires: number }> {
	const expires = Math.floor(Date.now() / 1000) + expiresIn
	const dataWithTimestamp = `${data}.${expires}`

	const signature = await signData(key, dataWithTimestamp)

	return { signature, expires }
}

/**
 * Verify a time-based signature
 *
 * @param key The signing key
 * @param signature The signature to verify
 * @param data The original data
 * @param expires The expiration timestamp
 * @returns True if valid and not expired
 */
export async function verifyTimedSignature(
	key: CryptoKey,
	signature: string,
	data: string,
	expires: number,
): Promise<boolean> {
	// Check if expired
	if (Math.floor(Date.now() / 1000) > expires) {
		logger.debug('Timed signature has expired')
		return false
	}

	const dataWithTimestamp = `${data}.${expires}`
	return verifySignature(key, signature, dataWithTimestamp)
}
