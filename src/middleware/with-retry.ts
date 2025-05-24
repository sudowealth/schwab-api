import {
	createSchwabApiError,
	SchwabError,
	SchwabRateLimitError,
	SchwabApiError,
	isAuthError,
	extractErrorMetadata,
	isCommunicationError,
} from '../errors'
import { createLogger } from '../utils/secure-logger'
import { type Middleware } from './compose'
import { getMetadata, cloneRequestWithMetadata } from './middleware-metadata'

const logger = createLogger('Retry')

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_MS = 1000
const JITTER_FACTOR = 0.1 // 10% jitter

export interface RetryOptions {
	/**
	 * Maximum number of retry attempts
	 * @default 3
	 */
	maxAttempts: number

	/**
	 * Base delay in milliseconds for exponential backoff
	 * @default 1000ms
	 */
	baseDelayMs: number

	/**
	 * Advanced retry options
	 */
	advanced?: {
		/**
		 * Whether to respect Retry-After headers from the server
		 * @default true
		 */
		respectRetryAfter?: boolean

		/**
		 * Maximum delay in milliseconds
		 * This caps the exponential backoff to prevent excessive delays
		 * @default 30000ms (30 seconds)
		 */
		maxDelayMs?: number

		/**
		 * Whether to skip the rate limit middleware on retry attempts
		 * Setting this to true prevents double-queueing of retry attempts
		 * @default true
		 */
		skipRateLimitOnRetry?: boolean
	}
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
	maxAttempts: DEFAULT_MAX_RETRIES,
	baseDelayMs: DEFAULT_BASE_MS,
	advanced: {
		respectRetryAfter: true,
		maxDelayMs: 30000,
		skipRateLimitOnRetry: true,
	},
}

/**
 * Creates middleware that automatically retries failed requests
 *
 * @param options Options for configuring retry behavior
 * @returns Middleware function
 */
export function withRetry(options?: Partial<RetryOptions>): Middleware {
	// Merge provided options with defaults
	const config: RetryOptions = {
		...DEFAULT_RETRY_OPTIONS,
		...options,
		advanced: {
			...DEFAULT_RETRY_OPTIONS.advanced,
			...options?.advanced,
		},
	}

	// Extract configuration values
	const maxRetries = config.maxAttempts
	const baseDelayMs = config.baseDelayMs
	const respectRetryAfter = config.advanced?.respectRetryAfter ?? true
	const maxDelayMs = config.advanced?.maxDelayMs ?? 30000
	const skipRateLimitOnRetry = config.advanced?.skipRateLimitOnRetry ?? true

	return async (req, next) => {
		// Get or initialize metadata
		const metadata = getMetadata(req)

		// Check if retry info already exists (this is a retry attempt)
		const isRetryAttempt = !!metadata.retry?.isRetry

		// Set or increment attempt counter
		if (!metadata.retry) {
			metadata.retry = {
				isRetry: false,
				attemptNumber: 1,
				maxAttempts: maxRetries + 1, // +1 because the initial attempt counts
				skipRateLimit: false,
			}
		}

		let attempts = metadata.retry.attemptNumber || 1
		let lastError: SchwabError | undefined

		while (attempts <= maxRetries + 1) {
			// +1 for initial attempt
			try {
				// Clone the request to preserve the body content and add retry metadata
				const requestClone = cloneRequestWithMetadata(req)
				const requestMetadata = getMetadata(requestClone)

				// Update retry metadata
				requestMetadata.retry = {
					isRetry: isRetryAttempt || attempts > 1,
					attemptNumber: attempts,
					maxAttempts: maxRetries + 1,
					skipRateLimit:
						skipRateLimitOnRetry && (isRetryAttempt || attempts > 1),
				}

				const response = await next(requestClone)

				// Check for error status codes that should trigger a retry
				if (response.status === 429 || response.status >= 500) {
					// Extract metadata from response headers to make smarter retry decisions
					const responseMetadata = extractErrorMetadata(response)

					// Create appropriate error type based on status code
					let errorBody: unknown
					try {
						errorBody = await response.clone().json()
					} catch {
						// If we can't parse JSON, use text
						try {
							errorBody = await response.clone().text()
						} catch {
							// If all else fails, use a simple object
							errorBody = { message: `Response status: ${response.status}` }
						}
					}

					// Create appropriate typed error based on status with metadata
					const error: SchwabApiError = createSchwabApiError(
						response.status,
						errorBody,
						(() => {
							switch (response.status) {
								case 429:
									return `withRetry: Rate limit exceeded (attempt ${attempts}/${maxRetries + 1})`
								case 503:
									return `withRetry: Service unavailable (attempt ${attempts}/${maxRetries + 1})`
								case 502:
									return `withRetry: Bad gateway (attempt ${attempts}/${maxRetries + 1})`
								case 504:
									return `withRetry: Gateway timeout (attempt ${attempts}/${maxRetries + 1})`
								case 500:
									return `withRetry: Server error (attempt ${attempts}/${maxRetries + 1})`
								default:
									return `withRetry: HTTP error ${response.status} (attempt ${attempts}/${maxRetries + 1})`
							}
						})(),
						responseMetadata,
					)

					// Check if the error is retryable
					if (!error.isRetryable({ ignoreRetryAfter: !respectRetryAfter })) {
						return response // Not a retryable error
					}

					// Check if we've reached max retries
					if (attempts > maxRetries) {
						// Add retry information to response metadata
						const responseMetadata = getMetadata(response)
						responseMetadata.retry = {
							isRetry: true,
							attemptNumber: attempts,
							maxAttempts: maxRetries + 1,
							skipRateLimit: false, // No longer relevant
						}

						return response // Max retries reached, return the last response
					}

					lastError = error

					// Consume the response body to free up resources, even if not used
					if (response.body) {
						try {
							await response.text()
						} catch {
							// Ignore errors from consuming the body
						}
					}
				} else {
					// Success or non-retryable status code

					// Add retry information to response metadata
					const responseMetadata = getMetadata(response)
					responseMetadata.retry = {
						isRetry: isRetryAttempt || attempts > 1,
						attemptNumber: attempts,
						maxAttempts: maxRetries + 1,
						skipRateLimit: false, // No longer relevant
					}

					return response
				}
			} catch (error) {
				// Convert to SchwabError if it's not already one
				if (error instanceof SchwabError) {
					lastError = error
				} else if (error instanceof Error) {
					lastError = new SchwabApiError(
						500,
						{ message: error.message, stack: error.stack },
						`withRetry: Request failed (attempt ${attempts}/${maxRetries + 1}): ${error.message}`,
					)
					lastError.originalError = error
				} else {
					lastError = new SchwabApiError(
						500,
						{ message: String(error) },
						`withRetry: Request failed (attempt ${attempts}/${maxRetries + 1}): ${String(error)}`,
					)
				}

				// Handle authentication errors with their own isRetryable method
				if (isAuthError(lastError) && !lastError.isRetryable()) {
					throw lastError // Non-retryable auth error, rethrow immediately
				}
				// Handle communication errors (network/timeout) specially
				else if (isCommunicationError(lastError)) {
					// Communication errors are always retryable, but we still check
					// to maintain consistent behavior
					if (!lastError.isRetryable()) {
						throw lastError
					}
					// Add debug logging for communication errors
					const errorType =
						lastError.cause === 'network' ? 'Network' : 'Timeout'
					logger.warn(
						`${errorType} error (${attempts}/${maxRetries + 1}). Will retry...`,
					)
				}
				// Handle API errors with their built-in isRetryable method
				else if (
					lastError instanceof SchwabApiError &&
					!lastError.isRetryable()
				) {
					throw lastError // Non-retryable API error, rethrow immediately
				}

				if (attempts > maxRetries) {
					throw lastError // Max retries reached, throw the last error
				}
			}

			attempts++
			metadata.retry.attemptNumber = attempts

			// Calculate delay - prefer server-provided retry information if available
			let serverSuggestedDelay = 0
			if (lastError instanceof SchwabApiError && respectRetryAfter) {
				const retryDelayMs = lastError.getRetryDelayMs()
				if (retryDelayMs !== null) {
					serverSuggestedDelay = retryDelayMs
				}
			}

			// Use exponential backoff with jitter as fallback
			let calculatedDelay = baseDelayMs * Math.pow(2, attempts - 2) // -2 because we've already incremented attempts
			const jitter = calculatedDelay * JITTER_FACTOR * (Math.random() - 0.5) * 2 // -10% to +10%
			calculatedDelay = Math.max(0, calculatedDelay + jitter)

			// Use the greater of server-suggested or calculated delay, but cap at maxDelayMs
			const totalDelay = Math.min(
				Math.max(serverSuggestedDelay, calculatedDelay),
				maxDelayMs,
			)

			// Check if there was rate-limiting involved to provide better logging
			if (lastError instanceof SchwabRateLimitError) {
				logger.warn(
					`Rate limit exceeded (${attempts - 1}/${maxRetries + 1}). Retrying in ${totalDelay}ms...`,
				)
			}

			await new Promise((resolve) => setTimeout(resolve, totalDelay))
		}

		// Should not be reached if logic is correct, but as a fallback:
		if (lastError) throw lastError

		// This line should ideally not be hit if the loop and conditions are correct.
		// If it is, it means a state was reached that wasn't expected.
		// For instance, if maxRetries is 0, the loop might not behave as expected.
		// Consider maxRetries=0 means 1 attempt.
		throw createSchwabApiError(
			500,
			{ message: 'Exited retry loop unexpectedly' },
			'withRetry: Exited retry loop unexpectedly.',
		)
	}
}
