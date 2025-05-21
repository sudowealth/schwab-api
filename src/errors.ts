import { z } from 'zod'

// ---- Error Codes ----

/**
 * API-level error codes for different types of errors
 */
export enum ApiErrorCode {
	NETWORK = 'NETWORK',
	RATE_LIMIT = 'RATE_LIMIT',
	TIMEOUT = 'TIMEOUT',
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	INVALID_REQUEST = 'INVALID_REQUEST',
	NOT_FOUND = 'NOT_FOUND',
	SERVER_ERROR = 'SERVER_ERROR',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	GATEWAY_ERROR = 'GATEWAY_ERROR',
	UNKNOWN = 'UNKNOWN',
}

/**
 * Authentication-specific error codes
 */
export enum AuthErrorCode {
	INVALID_CODE = 'INVALID_CODE', // The authorization code is invalid
	UNAUTHORIZED = 'UNAUTHORIZED', // The client credentials are invalid
	TOKEN_EXPIRED = 'TOKEN_EXPIRED', // The refresh token has expired or is invalid (Schwab refresh tokens expire after 7 days)
	NETWORK = 'NETWORK', // A network error occurred
	REFRESH_NEEDED = 'REFRESH_NEEDED', // The access token has expired and needs to be refreshed
	UNKNOWN = 'UNKNOWN', // An unknown error occurred

	// Token persistence errors
	TOKEN_PERSISTENCE_LOAD_FAILED = 'TOKEN_PERSISTENCE_LOAD_FAILED', // Failed to load tokens from storage
	TOKEN_PERSISTENCE_SAVE_FAILED = 'TOKEN_PERSISTENCE_SAVE_FAILED', // Failed to save tokens to storage

	// Token validation errors
	TOKEN_VALIDATION_ERROR = 'TOKEN_VALIDATION_ERROR', // Token validation failed

	// PKCE flow errors
	PKCE_VERIFIER_MISSING = 'PKCE_VERIFIER_MISSING', // PKCE code verifier is missing for token exchange

	// Configuration errors
	TOKEN_ENDPOINT_CONFIG_ERROR = 'TOKEN_ENDPOINT_CONFIG_ERROR', // Token endpoint configuration is missing or invalid
}

// ---- Error Response Metadata ----

/**
 * Common HTTP response headers that contain useful error metadata
 */
export interface ErrorResponseMetadata {
	/**
	 * Suggested wait time in seconds before retrying (from Retry-After header)
	 */
	retryAfterSeconds?: number

	/**
	 * Timestamp indicating when to retry (from Retry-After header with HTTP date)
	 */
	retryAfterDate?: Date

	/**
	 * Rate limit information (from X-RateLimit-* headers)
	 */
	rateLimit?: {
		/**
		 * Current rate limit in requests per time window
		 */
		limit?: number

		/**
		 * Remaining requests allowed in current time window
		 */
		remaining?: number

		/**
		 * When the rate limit window resets (Unix timestamp)
		 */
		reset?: number
	}

	/**
	 * Request ID for tracing and debugging (from X-Request-ID header)
	 * This is a unique identifier for the request that can be used
	 * to trace the request through the API system for debugging
	 */
	requestId?: string

	/**
	 * The endpoint path that was requested
	 * This helps identify which API endpoint generated the error
	 */
	endpointPath?: string

	/**
	 * HTTP method used for the request (GET, POST, etc.)
	 */
	requestMethod?: string

	/**
	 * Timestamp when the error occurred
	 * Useful for correlating errors with logs
	 */
	timestamp?: Date

	/**
	 * Raw headers from the response for custom processing
	 */
	headers?: Record<string, string>
}

// ---- Error Schemas ----

export const ErrorSourceSchema = z.object({
	pointer: z.array(z.string()).optional(),
	parameter: z.string().optional(),
	header: z.string().optional(),
})

export const ErrorSchema = z.object({
	id: z.string().uuid(),
	status: z.enum([
		'400',
		'401',
		'403',
		'404',
		'429',
		'500',
		'502',
		'503',
		'504',
	]),
	title: z.string(),
	detail: z.string(),
	source: ErrorSourceSchema.optional(),
})

export const ErrorResponseSchema = z.object({
	errors: z.array(ErrorSchema),
})
export type ErrorResponseSchema = z.infer<typeof ErrorResponseSchema>
export type ErrorObject = z.infer<typeof ErrorSchema>

// ---- Base Error Class ----

/**
 * Base class for all Schwab API errors
 */
export class SchwabError extends Error {
	/**
	 * Original error object if this error wraps another
	 */
	originalError?: unknown

	constructor(message: string) {
		super(message)
		this.name = 'SchwabError'
		Object.setPrototypeOf(this, SchwabError.prototype) // Ensure instanceof works correctly
	}

	/**
	 * Determines if this error is retryable
	 * Base implementation returns false - subclasses should override as needed
	 * @returns boolean indicating if the request can be retried
	 */
	isRetryable(): boolean {
		return false
	}
}

/**
 * Type guard to check if an error is an instance of SchwabError
 */
export function isSchwabError(e: unknown): e is SchwabError {
	return e instanceof SchwabError
}

// ---- Auth Errors ----

/**
 * Error representing authentication failures
 */
export class SchwabAuthError extends SchwabError {
	/**
	 * HTTP status code if available
	 */
	status?: number

	/**
	 * Auth-specific error code
	 */
	code: AuthErrorCode

	/**
	 * Response body or error details
	 */
	body?: unknown

	constructor(
		code: AuthErrorCode,
		message?: string,
		status?: number,
		body?: unknown,
	) {
		super(message || `Schwab Auth Error: ${code}`)
		this.code = code
		this.status = status
		this.body = body
		this.name = 'SchwabAuthError'
		Object.setPrototypeOf(this, SchwabAuthError.prototype)
	}

	/**
	 * Determines if this authentication error is retryable
	 * @returns boolean indicating if the auth error can be retried
	 */
	override isRetryable(): boolean {
		switch (this.code) {
			case AuthErrorCode.NETWORK:
			case AuthErrorCode.REFRESH_NEEDED:
			case AuthErrorCode.TOKEN_EXPIRED:
			case AuthErrorCode.TOKEN_PERSISTENCE_LOAD_FAILED:
				return true
			case AuthErrorCode.UNAUTHORIZED:
			case AuthErrorCode.INVALID_CODE:
			case AuthErrorCode.TOKEN_PERSISTENCE_SAVE_FAILED:
			case AuthErrorCode.TOKEN_VALIDATION_ERROR:
			case AuthErrorCode.PKCE_VERIFIER_MISSING:
			case AuthErrorCode.TOKEN_ENDPOINT_CONFIG_ERROR:
			case AuthErrorCode.UNKNOWN:
			default:
				return false
		}
	}
}

// ---- API Errors ----

/**
 * Error representing failures from the API
 */
export class SchwabApiError extends SchwabError {
	/**
	 * HTTP status code from the response
	 */
	status: number

	/**
	 * Response body or error details
	 */
	body?: unknown

	/**
	 * API error code
	 */
	code: ApiErrorCode

	/**
	 * Parsed error response conforming to the ErrorResponseSchema, if available
	 */
	parsedError?: ErrorResponseSchema

	/**
	 * Metadata extracted from the response headers
	 */
	metadata?: ErrorResponseMetadata

	constructor(
		status: number,
		body?: unknown,
		message?: string,
		code?: ApiErrorCode,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(message || `Schwab API Error: ${status}`)
		this.status = status
		this.body = body
		this.name = 'SchwabApiError'
		this.code = code || mapStatusToErrorCode(status)
		this.parsedError = parsedError
		this.metadata = metadata
		Object.setPrototypeOf(this, SchwabApiError.prototype)
	}

	/**
	 * Get a formatted summary of all error details
	 */
	getFormattedDetails(): string {
		if (!this.parsedError?.errors?.length) {
			return this.message
		}

		return this.parsedError.errors
			.map((err) => {
				let detail = ''
				if (err.title) detail += `${err.title}`
				if (err.detail) detail += ` - ${err.detail}`
				if (err.source?.parameter)
					detail += ` (parameter: ${err.source.parameter})`
				return detail
			})
			.join('; ')
	}

	/**
	 * Checks if this error has retry information
	 */
	hasRetryInfo(): boolean {
		return (
			!!this.metadata?.retryAfterSeconds ||
			!!this.metadata?.retryAfterDate ||
			!!this.metadata?.rateLimit?.reset
		)
	}

	/**
	 * Get the suggested retry delay in milliseconds
	 * @returns Number of milliseconds to wait or null if no retry info
	 */
	getRetryDelayMs(): number | null {
		// If we have a direct retry-after in seconds
		if (this.metadata?.retryAfterSeconds) {
			return this.metadata.retryAfterSeconds * 1000
		}

		// If we have a retry-after date
		if (this.metadata?.retryAfterDate) {
			const delayMs = this.metadata.retryAfterDate.getTime() - Date.now()
			return delayMs > 0 ? delayMs : 0
		}

		// If we have a rate limit reset time
		if (this.metadata?.rateLimit?.reset) {
			const resetTime = this.metadata.rateLimit.reset * 1000 // Convert to milliseconds
			const delayMs = resetTime - Date.now()
			return delayMs > 0 ? delayMs : 0
		}

		return null
	}

	/**
	 * Get the request ID for debugging purposes
	 * @returns Request ID if available, undefined otherwise
	 */
	getRequestId(): string | undefined {
		return this.metadata?.requestId
	}

	/**
	 * Get a debugging context string with request details
	 * @returns A string with request details for debugging
	 */
	getDebugContext(): string {
		const parts: string[] = []

		if (this.metadata?.requestId) {
			parts.push(`Request ID: ${this.metadata.requestId}`)
		}

		if (this.metadata?.requestMethod && this.metadata?.endpointPath) {
			parts.push(
				`Endpoint: ${this.metadata.requestMethod} ${this.metadata.endpointPath}`,
			)
		}

		if (this.metadata?.timestamp) {
			parts.push(`Time: ${this.metadata.timestamp.toISOString()}`)
		}

		return parts.length > 0 ? parts.join(' | ') : 'No debug context available'
	}

	/**
	 * Determines if this error is retryable based on status code and metadata
	 * @param options Optional parameters to customize retry behavior
	 * @returns boolean indicating if the request can be retried
	 */
	isRetryable(options?: { ignoreRetryAfter?: boolean }): boolean {
		// Status codes that are generally retryable
		const retryableStatusCodes = [408, 429, 500, 502, 503, 504, 0]

		// Check if status is in retryable list
		if (!retryableStatusCodes.includes(this.status)) {
			return false
		}

		// Honor Retry-After headers if present and not ignored
		if (!options?.ignoreRetryAfter && this.hasRetryInfo()) {
			return true
		}

		// Default to true for all retryable status codes
		return true
	}
}

/**
 * Type guard to check if an error is an instance of SchwabApiError
 */
export function isSchwabApiError(e: unknown): e is SchwabApiError {
	return e instanceof SchwabApiError
}

// ---- Specialized Error Classes ----

/**
 * Retryable API errors (network, server, gateway)
 */
export class RetryableApiError extends SchwabApiError {
	constructor(
		status: number,
		body?: unknown,
		message?: string,
		code?: ApiErrorCode,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(status, body, message, code, parsedError, metadata)
		this.name = 'RetryableApiError'
		Object.setPrototypeOf(this, RetryableApiError.prototype)
	}

	/**
	 * All errors of this class are retryable by definition
	 */
	override isRetryable(): boolean {
		return true
	}
}

/**
 * 429 - Rate Limit Exceeded, with specialized methods for handling rate limits
 */
export class SchwabRateLimitError extends RetryableApiError {
	constructor(
		body?: unknown,
		message?: string,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(
			429,
			body,
			message || 'Schwab Rate Limit Error',
			ApiErrorCode.RATE_LIMIT,
			parsedError,
			metadata,
		)
		this.name = 'SchwabRateLimitError'
		Object.setPrototypeOf(this, SchwabRateLimitError.prototype)
	}

	/**
	 * Get the remaining requests allowed in the current window
	 */
	getRemainingRequests(): number | undefined {
		return this.metadata?.rateLimit?.remaining
	}

	/**
	 * Get the time when the rate limit will reset (in milliseconds)
	 */
	getResetTimeMs(): number | undefined {
		return this.metadata?.rateLimit?.reset !== undefined
			? this.metadata.rateLimit.reset * 1000
			: undefined
	}
}

/**
 * Client-side errors represent 4xx responses that are non-retryable
 */
export class ClientApiError extends SchwabApiError {
	constructor(
		status: number,
		body?: unknown,
		message?: string,
		code?: ApiErrorCode,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(status, body, message, code, parsedError, metadata)
		this.name = 'ClientApiError'
		Object.setPrototypeOf(this, ClientApiError.prototype)
	}

	/**
	 * Client errors are generally not retryable
	 */
	override isRetryable(): boolean {
		return false
	}
}

/**
 * 401 - Unauthorized - Specifically maintained as a separate class due to
 * its importance in authentication flows
 */
export class SchwabAuthorizationError extends ClientApiError {
	constructor(
		body?: unknown,
		message?: string,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(
			401,
			body,
			message || 'Schwab Authorization Error',
			ApiErrorCode.UNAUTHORIZED,
			parsedError,
			metadata,
		)
		this.name = 'SchwabAuthorizationError'
		Object.setPrototypeOf(this, SchwabAuthorizationError.prototype)
	}
}

/**
 * Enum to indicate the specific type of server error
 */
export enum ServerErrorReason {
	/**
	 * Generic internal server error (500)
	 */
	INTERNAL_ERROR = 'INTERNAL_ERROR',

	/**
	 * Bad gateway error (502) - upstream service returned invalid response
	 */
	BAD_GATEWAY = 'BAD_GATEWAY',

	/**
	 * Service unavailable (503) - server temporarily unavailable
	 */
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

	/**
	 * Gateway timeout (504) - upstream service timed out
	 */
	GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
}

/**
 * Unified server-side error class for all 5xx errors (500, 502, 503, 504)
 * Consolidates the functionality of SchwabServiceUnavailableError and SchwabGatewayError
 */
export class SchwabServerError extends RetryableApiError {
	/**
	 * Specific reason for the server error
	 */
	reason: ServerErrorReason

	constructor(
		status: number = 500,
		body?: unknown,
		message?: string,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		// Determine proper code and reason based on status
		let code: ApiErrorCode
		let reason: ServerErrorReason

		if (status === 503) {
			code = ApiErrorCode.SERVICE_UNAVAILABLE
			reason = ServerErrorReason.SERVICE_UNAVAILABLE
		} else if (status === 502) {
			code = ApiErrorCode.GATEWAY_ERROR
			reason = ServerErrorReason.BAD_GATEWAY
		} else if (status === 504) {
			code = ApiErrorCode.GATEWAY_ERROR
			reason = ServerErrorReason.GATEWAY_TIMEOUT
		} else {
			code = ApiErrorCode.SERVER_ERROR
			reason = ServerErrorReason.INTERNAL_ERROR
		}

		// Create default message based on status
		let defaultMessage = 'Schwab Server Error'
		if (status === 503) {
			defaultMessage =
				'Schwab Service Unavailable - The server is temporarily unable to handle the request'
		} else if (status === 502) {
			defaultMessage =
				'Schwab Bad Gateway Error - An upstream service returned an invalid response'
		} else if (status === 504) {
			defaultMessage = 'Schwab Gateway Timeout - An upstream service timed out'
		}

		super(status, body, message || defaultMessage, code, parsedError, metadata)

		this.reason = reason
		this.name = 'SchwabServerError'
		Object.setPrototypeOf(this, SchwabServerError.prototype)
	}

	/**
	 * Checks if this is a service unavailable error (503)
	 */
	isServiceUnavailable(): boolean {
		return this.reason === ServerErrorReason.SERVICE_UNAVAILABLE
	}

	/**
	 * Checks if this is a gateway error (502 or 504)
	 */
	isGatewayError(): boolean {
		return (
			this.reason === ServerErrorReason.BAD_GATEWAY ||
			this.reason === ServerErrorReason.GATEWAY_TIMEOUT
		)
	}
}

/**
 * Base class for communication-related errors (network, timeout)
 * This provides a common type for errors related to communication issues
 *
 * Note: This class inherits all the functionality of RetryableApiError including:
 * - isRetryable(): Always returns true
 * - All status, code, and metadata handling methods
 *
 * Use isCommunicationError() type guard to check if an error is related to network or timeout
 */
export class RetryableCommunicationError extends RetryableApiError {
	/**
	 * Cause of the communication error
	 */
	cause: 'network' | 'timeout'

	constructor(
		status: number,
		code: ApiErrorCode,
		cause: 'network' | 'timeout',
		body?: unknown,
		message?: string,
		metadata?: ErrorResponseMetadata,
	) {
		super(status, body, message, code, undefined, metadata)
		this.name = 'RetryableCommunicationError'
		this.cause = cause
		Object.setPrototypeOf(this, RetryableCommunicationError.prototype)
	}

	/**
	 * Determines if this is a network error
	 */
	isNetworkError(): boolean {
		return this.cause === 'network'
	}

	/**
	 * Determines if this is a timeout error
	 */
	isTimeoutError(): boolean {
		return this.cause === 'timeout'
	}
}

/**
 * Network error (no status code)
 */
export class SchwabNetworkError extends RetryableCommunicationError {
	constructor(
		body?: unknown,
		message?: string,
		metadata?: ErrorResponseMetadata,
	) {
		// Use 0 as status code since there's no HTTP status for network errors
		super(
			0,
			ApiErrorCode.NETWORK,
			'network',
			body,
			message || 'Schwab Network Error',
			metadata,
		)
		this.name = 'SchwabNetworkError'
		Object.setPrototypeOf(this, SchwabNetworkError.prototype)
	}
}

/**
 * Timeout error
 */
export class SchwabTimeoutError extends RetryableCommunicationError {
	constructor(
		body?: unknown,
		message?: string,
		metadata?: ErrorResponseMetadata,
	) {
		// Use 408 as status code for timeout
		super(
			408,
			ApiErrorCode.TIMEOUT,
			'timeout',
			body,
			message || 'Schwab Request Timeout',
			metadata,
		)
		this.name = 'SchwabTimeoutError'
		Object.setPrototypeOf(this, SchwabTimeoutError.prototype)
	}
}

// ---- Type Guards ----

/**
 * Type guards for different error types
 * These functions allow for narrowing error types in catch blocks
 */

export function isRateLimitError(e: unknown): e is SchwabRateLimitError {
	return e instanceof SchwabRateLimitError
}

export function isServerError(e: unknown): e is SchwabServerError {
	return e instanceof SchwabServerError
}

/**
 * Check if an error is a client error, optionally with a specific status code
 */
export function isClientError(
	e: unknown,
	status?: number,
): e is ClientApiError {
	if (!(e instanceof ClientApiError)) return false
	if (status !== undefined) return e.status === status
	return true
}

/**
 * Check if an error is a server error with a specific status code
 */
export function isServerErrorWithStatus(
	e: unknown,
	status: number,
): e is SchwabServerError {
	return e instanceof SchwabServerError && e.status === status
}

/**
 * Check if an error is a server error with one of the provided status codes
 */
export function isServerErrorWithAnyStatus(
	e: unknown,
	statuses: number[],
): e is SchwabServerError {
	return e instanceof SchwabServerError && statuses.includes(e.status)
}

/**
 * Check if an error is a server error with a specific reason
 */
export function isServerErrorWithReason(
	e: unknown,
	reason: ServerErrorReason,
): e is SchwabServerError {
	return e instanceof SchwabServerError && e.reason === reason
}

export function isAuthError(e: unknown): e is SchwabAuthError {
	return e instanceof SchwabAuthError
}

/**
 * Type guard to check if an error is a communication error (network or timeout)
 */
export function isCommunicationError(
	e: unknown,
): e is RetryableCommunicationError {
	return e instanceof RetryableCommunicationError
}

/**
 * Type guard to check if an error is a network error, either through direct instance
 * or through the RetryableCommunicationError with cause='network'
 */
export function isNetworkError(
	e: unknown,
): e is SchwabNetworkError | RetryableCommunicationError {
	if (e instanceof SchwabNetworkError) {
		return true
	}
	return e instanceof RetryableCommunicationError && e.cause === 'network'
}

/**
 * Type guard to check if an error is a timeout error, either through direct instance
 * or through the RetryableCommunicationError with cause='timeout'
 */
export function isTimeoutError(
	e: unknown,
): e is SchwabTimeoutError | RetryableCommunicationError {
	if (e instanceof SchwabTimeoutError) {
		return true
	}
	return e instanceof RetryableCommunicationError && e.cause === 'timeout'
}

export function isUnauthorizedError(e: unknown): e is SchwabAuthorizationError {
	return e instanceof SchwabAuthorizationError
}

/**
 * Check for errors with specific status codes without requiring specific classes
 */
export function hasForbiddenStatus(e: unknown): boolean {
	return e instanceof SchwabApiError && e.status === 403
}

export function hasNotFoundStatus(e: unknown): boolean {
	return e instanceof SchwabApiError && e.status === 404
}

export function hasInvalidRequestStatus(e: unknown): boolean {
	return e instanceof SchwabApiError && e.status === 400
}

export function isRetryableError(e: unknown): boolean {
	if (e instanceof SchwabError) {
		return e.isRetryable()
	}
	return false
}

export function isServerSideError(e: unknown): e is RetryableApiError {
	return e instanceof RetryableApiError
}

// ---- Error Categorization Utilities ----

export function getErrorStatusCode(e: unknown): number {
	if (e instanceof SchwabApiError) {
		return e.status
	}
	return 0
}

export function getErrorCategory(e: unknown): string {
	if (e instanceof SchwabApiError) {
		return e.code
	} else if (e instanceof SchwabAuthError) {
		return e.code
	} else if (e instanceof SchwabError) {
		return 'SCHWAB_ERROR'
	} else if (e instanceof Error) {
		return 'JS_ERROR'
	}
	return 'UNKNOWN'
}

// ---- Error Creation Utilities ----

/**
 * Maps HTTP status codes to API error codes
 */
function mapStatusToErrorCode(status: number): ApiErrorCode {
	switch (status) {
		case 400:
			return ApiErrorCode.INVALID_REQUEST
		case 401:
			return ApiErrorCode.UNAUTHORIZED
		case 403:
			return ApiErrorCode.FORBIDDEN
		case 404:
			return ApiErrorCode.NOT_FOUND
		case 429:
			return ApiErrorCode.RATE_LIMIT
		case 408:
			return ApiErrorCode.TIMEOUT
		case 0:
			return ApiErrorCode.NETWORK
		case 500:
			return ApiErrorCode.SERVER_ERROR
		case 503:
			return ApiErrorCode.SERVICE_UNAVAILABLE
		case 502:
		case 504:
			return ApiErrorCode.GATEWAY_ERROR
		default:
			return ApiErrorCode.UNKNOWN
	}
}

/**
 * Extract error metadata from response headers
 * @param response The fetch Response object
 * @param request Optional original request for additional context
 * @returns Error metadata extracted from headers
 */
export function extractErrorMetadata(
	response: Response,
	request?: Request,
): ErrorResponseMetadata {
	const metadata: ErrorResponseMetadata = {
		headers: {},
		timestamp: new Date(), // Add current timestamp
	}

	// Convert headers to a plain object for easy access and storage
	response.headers.forEach((value, key) => {
		if (metadata.headers) {
			metadata.headers[key.toLowerCase()] = value
		}
	})

	// Extract request ID from various possible headers
	// APIs often use different header names for request IDs
	const requestIdHeaders = [
		'x-request-id',
		'x-correlation-id',
		'request-id',
		'x-amzn-requestid',
		'x-schwab-request-id', // Schwab-specific
		'correlation-id',
	]

	for (const header of requestIdHeaders) {
		const value = response.headers.get(header)
		if (value) {
			metadata.requestId = value
			break
		}
	}

	// Extract endpoint path and method from the request if available
	if (request) {
		try {
			const url = new URL(request.url)
			metadata.endpointPath = url.pathname
			metadata.requestMethod = request.method
		} catch {
			// If URL parsing fails, try to get path directly
			const urlMatch = request.url.match(/^https?:\/\/[^\/]+(\/[^?]*)/)
			if (urlMatch) {
				metadata.endpointPath = urlMatch[1]
			}
			metadata.requestMethod = request.method
		}
	}

	// Extract Retry-After header (could be seconds or HTTP date)
	const retryAfter = response.headers.get('retry-after')
	if (retryAfter) {
		// Check if it's a number (seconds)
		const seconds = parseInt(retryAfter, 10)
		if (!isNaN(seconds)) {
			metadata.retryAfterSeconds = seconds
		} else {
			// Try to parse as HTTP date
			try {
				const date = new Date(retryAfter)
				if (!isNaN(date.getTime())) {
					metadata.retryAfterDate = date
				}
			} catch {
				// Invalid date format, ignore
			}
		}
	}

	// Extract rate limit headers
	const rateLimit = response.headers.get('x-ratelimit-limit')
	const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
	const rateLimitReset = response.headers.get('x-ratelimit-reset')

	if (rateLimit || rateLimitRemaining || rateLimitReset) {
		metadata.rateLimit = {}

		if (rateLimit) {
			const limit = parseInt(rateLimit, 10)
			if (!isNaN(limit)) {
				metadata.rateLimit.limit = limit
			}
		}

		if (rateLimitRemaining) {
			const remaining = parseInt(rateLimitRemaining, 10)
			if (!isNaN(remaining)) {
				metadata.rateLimit.remaining = remaining
			}
		}

		if (rateLimitReset) {
			const reset = parseInt(rateLimitReset, 10)
			if (!isNaN(reset)) {
				metadata.rateLimit.reset = reset
			}
		}
	}

	return metadata
}

/**
 * Parses and validates an error response against the ErrorResponseSchema
 * @param body Response body to parse
 * @returns Validated ErrorResponse object or undefined if validation fails
 */
export function parseErrorResponse(
	body: unknown,
): ErrorResponseSchema | undefined {
	if (!body || typeof body !== 'object') {
		return undefined
	}

	// Check if the body has the expected errors array structure
	if ('errors' in body && Array.isArray((body as any).errors)) {
		const result = ErrorResponseSchema.safeParse(body)
		if (result.success) {
			return result.data
		}
	}

	return undefined
}

/**
 * Factory function to create the appropriate error type based on status code and metadata
 * This is the RECOMMENDED way to create errors in the codebase to ensure consistency
 */
export function createSchwabApiError(
	status: number,
	body?: unknown,
	message?: string,
	metadata?: ErrorResponseMetadata,
): SchwabApiError {
	// Try to parse the error response
	const parsedError = parseErrorResponse(body)

	// Create appropriate error type based on status code
	switch (status) {
		case 0:
			// Network error - no HTTP status available
			return new SchwabNetworkError(body, message, metadata)
		case 400:
			return new ClientApiError(
				400,
				body,
				message || 'Schwab Invalid Request Error',
				ApiErrorCode.INVALID_REQUEST,
				parsedError,
				metadata,
			)
		case 401:
			return new SchwabAuthorizationError(body, message, parsedError, metadata)
		case 403:
			return new ClientApiError(
				403,
				body,
				message || 'Schwab Forbidden Error',
				ApiErrorCode.FORBIDDEN,
				parsedError,
				metadata,
			)
		case 404:
			return new ClientApiError(
				404,
				body,
				message || 'Schwab Not Found Error',
				ApiErrorCode.NOT_FOUND,
				parsedError,
				metadata,
			)
		case 408:
			// Timeout error
			return new SchwabTimeoutError(body, message, metadata)
		case 429:
			return new SchwabRateLimitError(body, message, parsedError, metadata)
		case 500:
		case 502:
		case 503:
		case 504:
			// All server errors use the consolidated SchwabServerError class
			return new SchwabServerError(status, body, message, parsedError, metadata)
		default:
			// For status codes not explicitly handled, decide based on range
			if (status >= 400 && status < 500) {
				return new ClientApiError(
					status,
					body,
					message,
					undefined,
					parsedError,
					metadata,
				)
			} else if (status >= 500 && status < 600) {
				// All 5xx errors use the consolidated SchwabServerError class
				return new SchwabServerError(
					status,
					body,
					message,
					parsedError,
					metadata,
				)
			} else {
				return new SchwabApiError(
					status,
					body,
					message,
					undefined,
					parsedError,
					metadata,
				)
			}
	}
}

/**
 * 400 - Bad Request - Invalid request, missing required parameters, etc.
 * Used by create-api-client
 */
export class SchwabInvalidRequestError extends ClientApiError {
	constructor(
		body?: unknown,
		message?: string,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(
			400,
			body,
			message || 'Schwab Invalid Request Error',
			ApiErrorCode.INVALID_REQUEST,
			parsedError,
			metadata,
		)
		this.name = 'SchwabInvalidRequestError'
		Object.setPrototypeOf(this, SchwabInvalidRequestError.prototype)
	}
}

/**
 * 404 - Not Found Error
 * Used by create-api-client
 */
export class SchwabNotFoundError extends ClientApiError {
	constructor(
		body?: unknown,
		message?: string,
		parsedError?: ErrorResponseSchema,
		metadata?: ErrorResponseMetadata,
	) {
		super(
			404,
			body,
			message || 'Schwab Not Found Error',
			ApiErrorCode.NOT_FOUND,
			parsedError,
			metadata,
		)
		this.name = 'SchwabNotFoundError'
		Object.setPrototypeOf(this, SchwabNotFoundError.prototype)
	}
}

/**
 * Factory function to create a service unavailable error (503)
 * Replacement for SchwabServiceUnavailableError class
 * Used by middleware/with-retry.ts
 */
export function createServiceUnavailableError(
	body?: unknown,
	message?: string,
	parsedError?: ErrorResponseSchema,
	metadata?: ErrorResponseMetadata,
): SchwabServerError {
	return new SchwabServerError(
		503,
		body,
		message || 'Schwab Service Unavailable Error',
		parsedError,
		metadata,
	)
}

/**
 * Factory function to create a gateway error (502/504)
 * Replacement for SchwabGatewayError class
 * Used by middleware/with-retry.ts
 */
export function createGatewayError(
	status: number = 502,
	body?: unknown,
	message?: string,
	parsedError?: ErrorResponseSchema,
	metadata?: ErrorResponseMetadata,
): SchwabServerError {
	if (status !== 502 && status !== 504) {
		status = 502 // Default to 502 if an invalid status is provided
	}

	return new SchwabServerError(
		status,
		body,
		message || 'Schwab Gateway Error',
		parsedError,
		metadata,
	)
}

/**
 * Attempts to parse a response error and create the appropriate error
 * This provides consistent error handling across various parts of the SDK
 */
export function handleApiError(error: unknown, context?: string): never {
	// If it's already a SchwabApiError or SchwabAuthError, just rethrow
	if (error instanceof SchwabApiError || error instanceof SchwabAuthError) {
		throw error
	}

	// If it's a timeout or abort error, create a timeout error
	if (error instanceof DOMException && error.name === 'AbortError') {
		throw new SchwabTimeoutError(
			{ message: 'Request timed out' },
			context ? `${context}: Request timed out` : 'Request timed out',
		)
	}

	// Handle network errors specifically
	if (
		error instanceof Error &&
		'code' in error &&
		['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(
			(error as any).code,
		)
	) {
		throw new SchwabNetworkError(
			{ message: error.message },
			context
				? `${context}: Network error - ${error.message}`
				: `Network error - ${error.message}`,
		)
	}

	// If it's a response error with status
	if (error instanceof Error && 'status' in error) {
		const status = (error as any).status || 500

		// Check if the error has a response body we can parse
		let errorBody = undefined
		if ('body' in error) {
			errorBody = (error as any).body
		} else if ('data' in error) {
			errorBody = (error as any).data
		}

		// Extract metadata if available
		let metadata: ErrorResponseMetadata | undefined = undefined
		if ('headers' in error && (error as any).headers) {
			metadata = {
				headers: (error as any).headers,
				timestamp: new Date(),
			}
		}

		throw createSchwabApiError(
			status,
			errorBody,
			context ? `${context}: ${error.message}` : error.message,
			metadata,
		)
	}

	// For standard errors or unknown errors
	const message =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: 'Unknown error'

	throw new SchwabApiError(
		500,
		error instanceof Error
			? { message: error.message, originalError: error }
			: error,
		context ? `${context}: ${message}` : message,
		undefined,
	)
}
