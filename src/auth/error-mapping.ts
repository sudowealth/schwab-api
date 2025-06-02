import {
	SchwabAuthError,
	SchwabApiError,
	ApiErrorCode,
	AuthErrorCode,
} from '../errors'

/**
 * Result of error mapping operation
 */
export interface ErrorMappingResult {
	/**
	 * HTTP status code to return
	 */
	httpStatus: number

	/**
	 * Human-readable error message
	 */
	message: string

	/**
	 * Error code for programmatic handling
	 */
	code: string

	/**
	 * Whether the error is retryable
	 */
	retryable: boolean

	/**
	 * Additional error details
	 */
	details?: Record<string, any>
}

/**
 * Interface for error mapping functionality
 */
export interface ErrorMapper {
	/**
	 * Map an authentication error to a standard response
	 */
	mapAuthError(error: SchwabAuthError): ErrorMappingResult

	/**
	 * Map an API error to a standard response
	 */
	mapApiError(error: SchwabApiError): ErrorMappingResult

	/**
	 * Get the appropriate HTTP status for any error
	 */
	getHttpStatusForError(error: Error): number

	/**
	 * Create a user-friendly message from an error
	 */
	getUserMessage(error: Error): string
}

/**
 * Default error mappings for Schwab errors
 */
const DEFAULT_AUTH_ERROR_MAPPINGS: Record<
	string,
	Partial<ErrorMappingResult>
> = {
	[AuthErrorCode.INVALID_CODE]: {
		httpStatus: 400,
		message: 'Invalid authorization code or PKCE verification failed',
		retryable: false,
	},
	[AuthErrorCode.PKCE_VERIFIER_MISSING]: {
		httpStatus: 400,
		message:
			'PKCE code verifier is missing - authorization state may be corrupted',
		retryable: false,
	},
	[AuthErrorCode.TOKEN_EXPIRED]: {
		httpStatus: 401,
		message: 'Authentication token has expired - please re-authenticate',
		retryable: false,
	},
	[AuthErrorCode.UNAUTHORIZED]: {
		httpStatus: 401,
		message: 'Invalid credentials or unauthorized access',
		retryable: false,
	},
	[AuthErrorCode.TOKEN_PERSISTENCE_LOAD_FAILED]: {
		httpStatus: 500,
		message: 'Failed to retrieve authentication state',
		retryable: true,
	},
	[AuthErrorCode.TOKEN_PERSISTENCE_SAVE_FAILED]: {
		httpStatus: 500,
		message: 'Failed to save authentication state',
		retryable: true,
	},
	[AuthErrorCode.TOKEN_VALIDATION_ERROR]: {
		httpStatus: 500,
		message: 'Authentication token validation failed',
		retryable: false,
	},
	[AuthErrorCode.TOKEN_ENDPOINT_CONFIG_ERROR]: {
		httpStatus: 500,
		message: 'Authentication system configuration error',
		retryable: false,
	},
	[AuthErrorCode.REFRESH_NEEDED]: {
		httpStatus: 401,
		message: 'Token refresh required',
		retryable: true,
	},
	[AuthErrorCode.NETWORK]: {
		httpStatus: 503,
		message: 'Network error during authentication',
		retryable: true,
	},
	[AuthErrorCode.UNKNOWN]: {
		httpStatus: 500,
		message: 'An unknown authentication error occurred',
		retryable: false,
	},
}

const DEFAULT_API_ERROR_MAPPINGS: Record<
	ApiErrorCode,
	Partial<ErrorMappingResult>
> = {
	[ApiErrorCode.NETWORK]: {
		httpStatus: 503,
		message: 'Network connectivity error',
		retryable: true,
	},
	[ApiErrorCode.RATE_LIMIT]: {
		httpStatus: 429,
		message: 'Rate limit exceeded - please try again later',
		retryable: true,
	},
	[ApiErrorCode.TIMEOUT]: {
		httpStatus: 408,
		message: 'Request timed out',
		retryable: true,
	},
	[ApiErrorCode.UNAUTHORIZED]: {
		httpStatus: 401,
		message: 'Authentication required',
		retryable: false,
	},
	[ApiErrorCode.FORBIDDEN]: {
		httpStatus: 403,
		message: 'Access denied',
		retryable: false,
	},
	[ApiErrorCode.INVALID_REQUEST]: {
		httpStatus: 400,
		message: 'Invalid request parameters',
		retryable: false,
	},
	[ApiErrorCode.NOT_FOUND]: {
		httpStatus: 404,
		message: 'Resource not found',
		retryable: false,
	},
	[ApiErrorCode.SERVER_ERROR]: {
		httpStatus: 500,
		message: 'Internal server error',
		retryable: true,
	},
	[ApiErrorCode.SERVICE_UNAVAILABLE]: {
		httpStatus: 503,
		message: 'Service temporarily unavailable',
		retryable: true,
	},
	[ApiErrorCode.GATEWAY_ERROR]: {
		httpStatus: 502,
		message: 'Bad gateway',
		retryable: true,
	},
	[ApiErrorCode.UNKNOWN]: {
		httpStatus: 500,
		message: 'An unknown error occurred',
		retryable: false,
	},
}

/**
 * Main error mapper implementation
 */
export class SchwabErrorMapper implements ErrorMapper {
	private authMappings: Record<string, Partial<ErrorMappingResult>>
	private apiMappings: Record<ApiErrorCode, Partial<ErrorMappingResult>>

	constructor(options?: {
		customAuthMappings?: Record<string, Partial<ErrorMappingResult>>
		customApiMappings?: Record<ApiErrorCode, Partial<ErrorMappingResult>>
	}) {
		this.authMappings = {
			...DEFAULT_AUTH_ERROR_MAPPINGS,
			...options?.customAuthMappings,
		}

		this.apiMappings = {
			...DEFAULT_API_ERROR_MAPPINGS,
			...options?.customApiMappings,
		}
	}

	/**
	 * Map an authentication error
	 */
	mapAuthError(error: SchwabAuthError): ErrorMappingResult {
		const mapping =
			this.authMappings[error.code] || this.authMappings[AuthErrorCode.UNKNOWN]

		return {
			httpStatus: mapping?.httpStatus || error.status || 500,
			message: mapping?.message || error.message,
			code: error.code,
			retryable: mapping?.retryable ?? error.isRetryable(),
			details: {
				originalMessage: error.message,
				...(error.body ? { body: error.body } : {}),
			},
		}
	}

	/**
	 * Map an API error
	 */
	mapApiError(error: SchwabApiError): ErrorMappingResult {
		const mapping =
			this.apiMappings[error.code] || this.apiMappings[ApiErrorCode.UNKNOWN]

		// Extract additional details from the error
		const details: Record<string, any> = {
			originalMessage: error.message,
			...(error.getRequestId() && { requestId: error.getRequestId() }),
		}

		// Add rate limit information if available
		if (error.code === ApiErrorCode.RATE_LIMIT && error.metadata?.rateLimit) {
			details.rateLimit = error.metadata.rateLimit
		}

		// Add retry information if available
		const retryDelayMs = error.getRetryDelayMs()
		if (retryDelayMs !== null) {
			details.retryAfter = Math.ceil(retryDelayMs / 1000)
		}

		return {
			httpStatus: mapping.httpStatus || error.status,
			message: mapping.message || error.getFormattedDetails(),
			code: error.code,
			retryable: mapping.retryable ?? error.isRetryable(),
			details,
		}
	}

	/**
	 * Get HTTP status for any error type
	 */
	getHttpStatusForError(error: Error): number {
		if (error instanceof SchwabAuthError) {
			return this.mapAuthError(error).httpStatus
		}

		if (error instanceof SchwabApiError) {
			return this.mapApiError(error).httpStatus
		}

		// Default to 500 for unknown errors
		return 500
	}

	/**
	 * Create a user-friendly message from any error
	 */
	getUserMessage(error: Error): string {
		if (error instanceof SchwabAuthError) {
			return this.mapAuthError(error).message
		}

		if (error instanceof SchwabApiError) {
			return this.mapApiError(error).message
		}

		// Generic message for unknown errors
		return 'An unexpected error occurred. Please try again later.'
	}

	/**
	 * Get all default mappings (useful for documentation)
	 */
	static getDefaultMappings(): {
		auth: Record<string, Partial<ErrorMappingResult>>
		api: Record<ApiErrorCode, Partial<ErrorMappingResult>>
	} {
		return {
			auth: DEFAULT_AUTH_ERROR_MAPPINGS,
			api: DEFAULT_API_ERROR_MAPPINGS,
		}
	}

	/**
	 * Create a standard error response object
	 */
	createErrorResponse(error: Error): {
		error: {
			code: string
			message: string
			details?: Record<string, any>
		}
		status: number
	} {
		let result: ErrorMappingResult

		if (error instanceof SchwabAuthError) {
			result = this.mapAuthError(error)
		} else if (error instanceof SchwabApiError) {
			result = this.mapApiError(error)
		} else {
			// Handle generic errors
			result = {
				httpStatus: 500,
				message: this.getUserMessage(error),
				code: 'INTERNAL_ERROR',
				retryable: false,
				details: {
					type: error.constructor.name,
					message: error.message,
				},
			}
		}

		return {
			error: {
				code: result.code,
				message: result.message,
				...(result.details && { details: result.details }),
			},
			status: result.httpStatus,
		}
	}
}

/**
 * Create a singleton instance with default mappings
 */
export const defaultErrorMapper = new SchwabErrorMapper()

/**
 * Utility function to map any Schwab error to a standard format
 *
 * @param error The error to map
 * @param options Additional options
 * @returns Mapped error result
 */
export function mapSchwabError(
	error: Error,
	options?: {
		includeStack?: boolean
		sanitize?: boolean
	},
): ErrorMappingResult & { stack?: string } {
	const mapper = defaultErrorMapper

	let result: ErrorMappingResult

	if (error instanceof SchwabAuthError) {
		result = mapper.mapAuthError(error)
	} else if (error instanceof SchwabApiError) {
		result = mapper.mapApiError(error)
	} else {
		// Generic error handling
		result = {
			httpStatus: 500,
			message: error.message || 'An unexpected error occurred',
			code: 'UNKNOWN_ERROR',
			retryable: false,
		}
	}

	// Add stack trace if requested (only in development)
	if (options?.includeStack && process.env.NODE_ENV !== 'production') {
		return {
			...result,
			stack: error.stack,
		}
	}

	return result
}

/**
 * Express/Connect middleware for error handling
 *
 * @example
 * ```typescript
 * app.use(schwabErrorHandler());
 * ```
 */
export function schwabErrorHandler(options?: {
	logger?: (error: Error, req: any) => void
	includeStack?: boolean
}) {
	return (error: Error, req: any, res: any) => {
		// Log the error if logger provided
		if (options?.logger) {
			options.logger(error, req)
		}

		// Map the error
		const response = defaultErrorMapper.createErrorResponse(error)

		// Send the response
		res.status(response.status).json(response)
	}
}

/**
 * Helper to determine if an error should trigger a re-authentication flow
 *
 * @param error The error to check
 * @returns True if re-authentication is needed
 */
export function requiresReauthentication(error: Error): boolean {
	if (error instanceof SchwabAuthError) {
		const authCodes = [
			AuthErrorCode.TOKEN_EXPIRED,
			AuthErrorCode.UNAUTHORIZED,
			AuthErrorCode.INVALID_CODE,
		]
		return authCodes.includes(error.code)
	}

	if (error instanceof SchwabApiError) {
		return error.code === ApiErrorCode.UNAUTHORIZED
	}

	return false
}

/**
 * Helper to extract retry information from errors
 *
 * @param error The error to check
 * @returns Retry information if available
 */
export function getRetryInfo(error: Error): {
	shouldRetry: boolean
	delayMs?: number
	reason?: string
} | null {
	if (error instanceof SchwabApiError) {
		const shouldRetry = error.isRetryable()
		const delayMs = error.getRetryDelayMs()

		if (!shouldRetry) {
			return null
		}

		return {
			shouldRetry: true,
			delayMs: delayMs ?? undefined,
			reason: error.code,
		}
	}

	if (error instanceof SchwabAuthError) {
		const shouldRetry = error.isRetryable()

		if (!shouldRetry) {
			return null
		}

		return {
			shouldRetry: true,
			reason: error.code,
		}
	}

	return null
}
