/**
 * Secure logger for Schwab API client
 * Focuses on protecting authentication tokens and credentials
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
	enabled: boolean
	level: LogLevel
}

// Patterns that indicate authentication/credential data
const SENSITIVE_PATTERNS = [
	/authorization/i,
	/bearer\s+[\w-]{1,1000}/gi, // Bounded to prevent ReDoS
	/refresh_token/i,
	/access_token/i,
	/client_secret/i,
	/client_id/i,
	/password/i,
	/token/i,
	/secret/i,
	/api_key/i,
]

// Field names that contain sensitive data
const SENSITIVE_FIELDS = new Set([
	// Auth headers
	'authorization',
	'Authorization',
	// OAuth tokens
	'access_token',
	'accessToken',
	'refresh_token',
	'refreshToken',
	// Client credentials
	'client_secret',
	'clientSecret',
	'client_id',
	'clientId',
	// Generic sensitive fields
	'password',
	'apiKey',
	'api_key',
	'token',
	'secret',
	'credential',
	'credentials',
	// Schwab-specific fields
	'schwabUserId',
	'accountNumber',
	'hashValue',
	'schwabClientCorrelId',
])

// Minimal set of dangerous keys for prototype pollution protection
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export class SecureLogger {
	private config: LoggerConfig

	constructor(config: Partial<LoggerConfig> = {}) {
		this.config = {
			enabled: process.env.NODE_ENV !== 'production',
			level: 'info',
			...config,
		}
	}

	/**
	 * Check if a string looks like a token
	 */
	private isLikelyToken(value: string): boolean {
		// JWT format: xxx.yyy.zzz
		if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
			return true
		}

		// Base64-like token (min 20 chars)
		if (value.length > 20 && /^[A-Za-z0-9+/=_-]{20,}$/.test(value)) {
			return true
		}

		return false
	}

	/**
	 * Sanitize a value to remove sensitive information
	 */
	private sanitizeValue(value: any): any {
		if (value === null || value === undefined) {
			return value
		}

		if (typeof value === 'string') {
			// Check for token-like strings
			if (this.isLikelyToken(value)) {
				return `[REDACTED ${value.length} chars]`
			}

			// Replace sensitive patterns
			let sanitized = value
			for (const pattern of SENSITIVE_PATTERNS) {
				if (pattern.test(sanitized)) {
					if (/authorization:\s*bearer/i.test(sanitized)) {
						sanitized = sanitized.replace(
							/bearer\s+[\w-]+/gi,
							'Bearer [REDACTED]',
						)
					} else {
						// For other patterns, check if it's a significant match
						const match = sanitized.match(pattern)
						if (match && match[0].length > 10) {
							sanitized = sanitized.replace(pattern, '[REDACTED]')
						}
					}
				}
			}
			return sanitized
		}

		if (Array.isArray(value)) {
			return value.map((item) => this.sanitizeValue(item))
		}

		if (value && typeof value === 'object') {
			// Special handling for errors
			if (value instanceof Error) {
				return this.sanitizeError(value)
			}
			return this.sanitizeObject(value)
		}

		return value
	}

	/**
	 * Sanitize error objects
	 */
	private sanitizeError(error: Error): string {
		// In production, minimize error information
		if (process.env.NODE_ENV === 'production') {
			return `${error.name}: [Error details hidden in production]`
		}

		// In development, show sanitized stack
		const sanitizedMessage = this.sanitizeValue(error.message)
		return `${error.name}: ${sanitizedMessage}\n${error.stack || '[No stack]'}`
	}

	/**
	 * Sanitize objects by checking field names
	 */
	private sanitizeObject(obj: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {}

		for (const [key, value] of Object.entries(obj)) {
			// Skip dangerous keys
			if (DANGEROUS_KEYS.has(key)) {
				continue
			}

			// Check if field name indicates sensitive data
			const lowerKey = key.toLowerCase()
			if (
				SENSITIVE_FIELDS.has(key) ||
				lowerKey.includes('token') ||
				lowerKey.includes('secret') ||
				lowerKey.includes('password') ||
				lowerKey.includes('credential') ||
				lowerKey.includes('key')
			) {
				sanitized[key] = '[REDACTED]'
			} else {
				// Recursively sanitize nested values
				sanitized[key] = this.sanitizeValue(value)
			}
		}

		return sanitized
	}

	/**
	 * Format log arguments for output
	 */
	private formatArgs(...args: any[]): string {
		return args
			.map((arg) => {
				if (typeof arg === 'string') {
					return this.sanitizeValue(arg)
				}
				if (arg instanceof Error) {
					return this.sanitizeError(arg)
				}
				if (typeof arg === 'object') {
					try {
						const sanitized = this.sanitizeValue(arg)
						return JSON.stringify(sanitized, null, 2)
					} catch {
						return '[Circular Reference]'
					}
				}
				return String(arg)
			})
			.join(' ')
	}

	/**
	 * Check if logging is allowed for the given level
	 */
	private shouldLog(level: LogLevel): boolean {
		if (!this.config.enabled) return false

		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
		const currentLevelIndex = levels.indexOf(this.config.level)
		const requestedLevelIndex = levels.indexOf(level)

		return requestedLevelIndex >= currentLevelIndex
	}

	debug(...args: any[]): void {
		if (this.shouldLog('debug')) {
			console.debug('[DEBUG]', this.formatArgs(...args))
		}
	}

	info(...args: any[]): void {
		if (this.shouldLog('info')) {
			console.info('[INFO]', this.formatArgs(...args))
		}
	}

	warn(...args: any[]): void {
		if (this.shouldLog('warn')) {
			console.warn('[WARN]', this.formatArgs(...args))
		}
	}

	error(...args: any[]): void {
		if (this.shouldLog('error')) {
			console.error('[ERROR]', this.formatArgs(...args))
		}
	}

	/**
	 * Log an error with additional context
	 * This method provides structured error logging
	 */
	logError(
		message: string,
		error: unknown,
		context?: Record<string, any>,
	): void {
		const errorInfo = sanitizeError(error)
		const sanitizedContext = context ? this.sanitizeObject(context) : undefined

		if (this.shouldLog('error')) {
			console.error('[ERROR]', message, {
				error: errorInfo,
				...(sanitizedContext && { context: sanitizedContext }),
			})
		}
	}
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(moduleName: string): SecureLogger {
	const logger = new SecureLogger({
		enabled: process.env.SCHWAB_DEBUG === 'true',
		level: (process.env.SCHWAB_LOG_LEVEL as LogLevel) || 'info',
	})

	// Add module name prefix
	const originalDebug = logger.debug.bind(logger)
	const originalInfo = logger.info.bind(logger)
	const originalWarn = logger.warn.bind(logger)
	const originalError = logger.error.bind(logger)

	logger.debug = (...args: any[]) => originalDebug(`[${moduleName}]`, ...args)
	logger.info = (...args: any[]) => originalInfo(`[${moduleName}]`, ...args)
	logger.warn = (...args: any[]) => originalWarn(`[${moduleName}]`, ...args)
	logger.error = (...args: any[]) => originalError(`[${moduleName}]`, ...args)

	return logger
}

// Default logger instance
export const logger = createLogger('SchwabAPI')

/**
 * Sanitize a key for logging
 * Shows only the beginning and end of the key
 *
 * @param key The key to sanitize
 * @param options Sanitization options
 * @returns Sanitized key safe for logging
 */
export function sanitizeKeyForLog(
	key: string,
	options: { maxLength?: number } = {},
): string {
	const maxLength = options.maxLength || 15

	if (!key || key.length <= maxLength) {
		return key
	}

	const prefixLength = Math.floor(maxLength * 0.6)
	const suffixLength = Math.floor(maxLength * 0.3)

	return `${key.substring(0, prefixLength)}...${key.substring(key.length - suffixLength)}`
}

/**
 * Sanitize an error object for safe logging
 * Removes sensitive data while preserving useful debugging information
 *
 * @param error The error to sanitize
 * @returns Sanitized error information
 */
export function sanitizeError(error: unknown): Record<string, any> {
	if (!error || typeof error !== 'object') {
		return { message: String(error) }
	}

	const err = error as any
	const sanitized: Record<string, any> = {}

	// Safe properties to include
	const safeProps = ['name', 'code', 'statusCode', 'status', 'type']
	for (const prop of safeProps) {
		if (prop in err) {
			sanitized[prop] = err[prop]
		}
	}

	// Sanitize message - remove potential sensitive data patterns
	if ('message' in err) {
		let message = String(err.message)

		// Remove any token-like strings from the message
		message = message.replace(/[A-Za-z0-9+/=_-]{20,}/g, '[REDACTED]')

		// Remove any patterns that look like account numbers
		message = message.replace(/\b\d{8,}\b/g, '[ACCOUNT]')

		sanitized.message = message
	}

	// Handle stack traces - only include in development
	if ('stack' in err && process.env.NODE_ENV !== 'production') {
		// Remove file paths that might reveal system structure
		const stack = String(err.stack)
			.split('\n')
			.slice(0, 5) // Limit stack trace depth
			.map((line) => line.replace(/\(.*\)/, '(...)')) // Remove file paths
			.join('\n')

		sanitized.stack = stack
	}

	// Include any additional safe metadata
	if ('requestId' in err) {
		sanitized.requestId = err.requestId
	}

	return sanitized
}

/**
 * Sanitize a token for logging
 * Shows only the beginning of the token and optionally its length
 *
 * @param token The token to sanitize
 * @param options Sanitization options
 * @returns Sanitized token safe for logging
 */
export function sanitizeTokenForLog(
	token: string,
	options: { showLength?: boolean } = {},
): string {
	if (!token) {
		return '[NO TOKEN]'
	}

	const preview =
		token.length > 8 ? `${token.substring(0, 8)}...` : '[SHORT TOKEN]'

	if (options.showLength) {
		return `${preview} (${token.length} chars)`
	}

	return preview
}
