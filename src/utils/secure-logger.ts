/**
 * Secure logger utility that sanitizes sensitive data before logging
 * This ensures no tokens, credentials, or sensitive information is exposed in logs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
	enabled: boolean
	level: LogLevel
	sanitizers?: Record<string, (value: any) => any>
}

// Default sanitization patterns
const SENSITIVE_PATTERNS = [
	/authorization/i,
	/bearer\s+\S+/gi,
	/refresh_token/i,
	/access_token/i,
	/client_secret/i,
	/client_id/i,
	/password/i,
	/token/i,
	/secret/i,
	/key/i,
	/credential/i,
]

// Fields that should always be sanitized
const SENSITIVE_FIELDS = new Set([
	'authorization',
	'Authorization',
	'access_token',
	'accessToken',
	'refresh_token',
	'refreshToken',
	'client_secret',
	'clientSecret',
	'client_id',
	'clientId',
	'password',
	'apiKey',
	'api_key',
	'token',
	'secret',
	'credential',
	'credentials',
])

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
	 * Sanitize a value to remove sensitive information
	 */
	private sanitizeValue(value: any): any {
		if (typeof value === 'string') {
			// Check if the entire string looks like a token (base64-like)
			if (value.length > 20 && /^[A-Za-z0-9+/=_-]{20,}$/.test(value)) {
				return `${value.substring(0, 8)}...[REDACTED]`
			}

			// Replace sensitive patterns in strings
			let sanitized = value
			for (const pattern of SENSITIVE_PATTERNS) {
				if (pattern.test(sanitized)) {
					// Special handling for Authorization headers
					if (/authorization:\s*bearer\s+/i.test(sanitized)) {
						sanitized = sanitized.replace(/bearer\s+\S+/gi, 'Bearer [REDACTED]')
					} else {
						// For other sensitive data, show partial
						const match = sanitized.match(pattern)
						if (match && match[0].length > 10) {
							sanitized = sanitized.replace(
								pattern,
								`${match[0].substring(0, 6)}...[REDACTED]`,
							)
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
			return this.sanitizeObject(value)
		}

		return value
	}

	/**
	 * Sanitize an object by checking field names and values
	 */
	private sanitizeObject(obj: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {}

		for (const [key, value] of Object.entries(obj)) {
			// Check if the field name indicates sensitive data
			if (SENSITIVE_FIELDS.has(key)) {
				if (typeof value === 'string' && value.length > 0) {
					sanitized[key] = `${value.substring(0, 6)}...[REDACTED]`
				} else {
					sanitized[key] = '[REDACTED]'
				}
			} else if (
				key.toLowerCase().includes('token') ||
				key.toLowerCase().includes('secret') ||
				key.toLowerCase().includes('password') ||
				key.toLowerCase().includes('credential')
			) {
				sanitized[key] = '[REDACTED]'
			} else {
				// Recursively sanitize nested values
				sanitized[key] = this.sanitizeValue(value)
			}
		}

		// Apply custom sanitizers if provided
		if (this.config.sanitizers) {
			for (const [field, sanitizer] of Object.entries(this.config.sanitizers)) {
				if (field in sanitized) {
					sanitized[field] = sanitizer(sanitized[field])
				}
			}
		}

		return sanitized
	}

	/**
	 * Format log arguments for safe output
	 */
	private formatArgs(...args: any[]): string {
		return args
			.map((arg) => {
				if (typeof arg === 'string') {
					return this.sanitizeValue(arg)
				}
				if (arg instanceof Error) {
					// Don't log full stack traces in production
					if (process.env.NODE_ENV === 'production') {
						return `${arg.name}: ${arg.message}`
					}
					return arg.stack || arg.toString()
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
	 * Create a child logger with additional configuration
	 */
	child(config: Partial<LoggerConfig>): SecureLogger {
		return new SecureLogger({
			...this.config,
			...config,
			sanitizers: {
				...this.config.sanitizers,
				...config.sanitizers,
			},
		})
	}
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(
	moduleName: string,
	config?: Partial<LoggerConfig>,
): SecureLogger {
	const logger = new SecureLogger({
		enabled: process.env.SCHWAB_DEBUG === 'true',
		level: (process.env.SCHWAB_LOG_LEVEL as LogLevel) || 'info',
		...config,
	})

	// Add module name to all logs
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
