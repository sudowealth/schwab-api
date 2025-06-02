import {
	createHmacKey,
	signData,
	verifySignature,
} from '../../utils/crypto-utils'
import { createLogger } from '../../utils/secure-logger'
import { type TokenData } from '../types'

const logger = createLogger('CookieTokenStore')

/**
 * Options for cookie-based token storage
 */
export interface CookieTokenStoreOptions {
	/**
	 * Secret key for signing cookies
	 */
	encryptionKey: string

	/**
	 * Cookie name for storing tokens
	 */
	cookieName?: string

	/**
	 * Cookie options
	 */
	cookieOptions?: {
		httpOnly?: boolean
		secure?: boolean
		sameSite?: 'strict' | 'lax' | 'none'
		maxAge?: number
		path?: string
		domain?: string
	}

	/**
	 * Whether to validate tokens on load
	 */
	validateOnLoad?: boolean
}

/**
 * Default cookie options for secure token storage
 */
const DEFAULT_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict' as const,
	path: '/',
	maxAge: 7 * 24 * 60 * 60, // 7 days
}

/**
 * Cookie-based token storage adapter
 * Provides secure token persistence using signed cookies
 */
export class CookieTokenStore {
	private options: Required<CookieTokenStoreOptions>

	constructor(options: CookieTokenStoreOptions) {
		this.options = {
			encryptionKey: options.encryptionKey,
			cookieName: options.cookieName || 'schwab_auth_tokens',
			cookieOptions: {
				...DEFAULT_COOKIE_OPTIONS,
				...options.cookieOptions,
			},
			validateOnLoad: options.validateOnLoad !== false,
		}

		if (!this.options.encryptionKey) {
			throw new Error('Encryption key is required for cookie token storage')
		}
	}

	/**
	 * Create a signed cookie value
	 *
	 * @param data Data to sign and encode
	 * @returns Signed cookie value in format "signature.base64(data)"
	 */
	async createSignedCookie(data: any): Promise<string> {
		const jsonData = JSON.stringify(data)
		const key = await createHmacKey(this.options.encryptionKey)
		const signature = await signData(key, jsonData)

		// Encode data as base64
		const base64Data = Buffer.from(jsonData).toString('base64')

		return `${signature}.${base64Data}`
	}

	/**
	 * Verify and decode a signed cookie value
	 *
	 * @param cookieValue Signed cookie value to verify
	 * @returns Decoded data or null if verification fails
	 */
	async verifyAndDecodeCookie<T>(cookieValue: string): Promise<T | null> {
		if (!cookieValue) {
			return null
		}

		const parts = cookieValue.split('.')
		if (parts.length !== 2) {
			logger.warn('Invalid cookie format: missing signature')
			return null
		}

		const [signature, base64Data] = parts

		try {
			// Decode the data
			const jsonData = Buffer.from(base64Data!, 'base64').toString('utf-8')

			// Verify signature
			const key = await createHmacKey(this.options.encryptionKey)
			const isValid = await verifySignature(key, signature!, jsonData)

			if (!isValid) {
				logger.warn('Cookie signature verification failed')
				return null
			}

			// Parse and return data
			return JSON.parse(jsonData) as T
		} catch (error) {
			logger.error('Error verifying cookie:', error)
			return null
		}
	}

	/**
	 * Save tokens to a cookie
	 *
	 * @param tokens Token data to save
	 * @returns Cookie header value
	 */
	async save(tokens: TokenData): Promise<string> {
		// Validate tokens before saving
		if (this.options.validateOnLoad && !this.validateTokens(tokens)) {
			throw new Error('Invalid tokens provided for cookie storage')
		}

		// Create signed cookie value
		const cookieValue = await this.createSignedCookie(tokens)

		// Build cookie header
		const cookieParts = [`${this.options.cookieName}=${cookieValue}`]

		// Add cookie options
		const { cookieOptions } = this.options

		if (cookieOptions.httpOnly) cookieParts.push('HttpOnly')
		if (cookieOptions.secure) cookieParts.push('Secure')
		if (cookieOptions.sameSite)
			cookieParts.push(`SameSite=${cookieOptions.sameSite}`)
		if (cookieOptions.maxAge)
			cookieParts.push(`Max-Age=${cookieOptions.maxAge}`)
		if (cookieOptions.path) cookieParts.push(`Path=${cookieOptions.path}`)
		if (cookieOptions.domain) cookieParts.push(`Domain=${cookieOptions.domain}`)

		return cookieParts.join('; ')
	}

	/**
	 * Load tokens from a cookie
	 *
	 * @param cookieHeader Cookie header value
	 * @returns Token data or null if not found/invalid
	 */
	async load(cookieHeader: string | null): Promise<TokenData | null> {
		if (!cookieHeader) {
			return null
		}

		// Extract cookie value
		const cookieValue = this.extractCookieValue(
			cookieHeader,
			this.options.cookieName,
		)
		if (!cookieValue) {
			return null
		}

		// Verify and decode
		const tokens = await this.verifyAndDecodeCookie<TokenData>(cookieValue)

		if (!tokens) {
			return null
		}

		// Validate if enabled
		if (this.options.validateOnLoad && !this.validateTokens(tokens)) {
			logger.warn('Loaded tokens failed validation')
			return null
		}

		return tokens
	}

	/**
	 * Clear the token cookie
	 *
	 * @returns Cookie header value to clear the cookie
	 */
	clear(): string {
		return `${this.options.cookieName}=; Path=${this.options.cookieOptions.path || '/'}; Max-Age=0`
	}

	/**
	 * Extract a specific cookie value from a cookie header
	 *
	 * @param cookieHeader Full cookie header string
	 * @param cookieName Name of cookie to extract
	 * @returns Cookie value or undefined
	 */
	private extractCookieValue(
		cookieHeader: string,
		cookieName: string,
	): string | undefined {
		const cookies = cookieHeader.split(';').map((c) => c.trim())
		const targetCookie = cookies.find((c) => c.startsWith(`${cookieName}=`))

		if (!targetCookie) {
			return undefined
		}

		return targetCookie.substring(cookieName.length + 1)
	}

	/**
	 * Validate token data
	 *
	 * @param tokens Token data to validate
	 * @returns True if valid, false otherwise
	 */
	private validateTokens(tokens: TokenData): boolean {
		if (!tokens || typeof tokens !== 'object') {
			return false
		}

		if (!tokens.accessToken || typeof tokens.accessToken !== 'string') {
			return false
		}

		// Refresh token is optional but must be string if present
		if (
			tokens.refreshToken !== undefined &&
			typeof tokens.refreshToken !== 'string'
		) {
			return false
		}

		// ExpiresAt is optional but must be positive number if present
		if (
			tokens.expiresAt !== undefined &&
			(typeof tokens.expiresAt !== 'number' || tokens.expiresAt <= 0)
		) {
			return false
		}

		return true
	}
}

/**
 * Helper function to create a cookie token store with Request/Response helpers
 */
export function createCookieTokenStore(options: CookieTokenStoreOptions) {
	const store = new CookieTokenStore(options)

	return {
		/**
		 * Save tokens and get the Set-Cookie header
		 */
		async save(tokens: TokenData): Promise<string> {
			return store.save(tokens)
		},

		/**
		 * Load tokens from a Request object
		 */
		async loadFromRequest(request: Request): Promise<TokenData | null> {
			const cookieHeader = request.headers.get('Cookie')
			return store.load(cookieHeader)
		},

		/**
		 * Load tokens from cookie header string
		 */
		async load(cookieHeader: string | null): Promise<TokenData | null> {
			return store.load(cookieHeader)
		},

		/**
		 * Create a Response with token cookie set
		 */
		async createResponseWithTokens(
			response: Response,
			tokens: TokenData,
		): Promise<Response> {
			const cookieHeader = await store.save(tokens)
			const newResponse = new Response(response.body, response)
			newResponse.headers.set('Set-Cookie', cookieHeader)
			return newResponse
		},

		/**
		 * Clear tokens by setting an expired cookie
		 */
		clear(): string {
			return store.clear()
		},

		/**
		 * The underlying store instance
		 */
		store,
	}
}
