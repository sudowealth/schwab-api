import { type Middleware } from './compose'
import { getMetadata, cloneRequestWithMetadata } from './middleware-metadata'

export interface RateLimitOptions {
	/**
	 * Maximum number of requests allowed in the time window
	 * @default 120
	 */
	maxRequests: number

	/**
	 * Time window in milliseconds
	 * @default 60000 (1 minute)
	 */
	windowMs: number

	/**
	 * Advanced rate limiting options
	 */
	advanced?: {
		/**
		 * Whether to apply rate limiting to retry attempts
		 * When false, retry attempts will skip rate limiting to avoid double counting
		 * @default true
		 */
		applyToRetries?: boolean
	}
}

/**
 * Default rate limit options
 */
export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
	maxRequests: 120,
	windowMs: 60_000,
	advanced: {
		applyToRetries: true,
	},
}

/**
 * Creates middleware that implements client-side rate limiting
 *
 * This middleware prevents your application from exceeding API rate limits
 * by queueing requests that would exceed the limit, then processing them
 * when the rate limit window resets.
 *
 * @param options Rate limit configuration options
 * @returns Middleware function
 */
export function withRateLimit(options?: Partial<RateLimitOptions>): Middleware {
	// Merge provided options with defaults
	const config: RateLimitOptions = {
		...DEFAULT_RATE_LIMIT,
		...options,
		advanced: {
			...DEFAULT_RATE_LIMIT.advanced,
			...options?.advanced,
		},
	}

	const maxRequests = config.maxRequests
	const windowDuration = config.windowMs
	const applyToRetries = config.advanced?.applyToRetries!

	let requestCount = 0
	let windowStart = Date.now()
	const requestQueue: (() => void)[] = []

	const processQueue = () => {
		if (requestQueue.length === 0) return

		const now = Date.now()
		if (now - windowStart > windowDuration) {
			requestCount = 0
			windowStart = now
		}

		if (requestCount < maxRequests) {
			requestCount++
			const resolveRequest = requestQueue.shift()
			if (resolveRequest) {
				resolveRequest()
			}
		} else {
			// Calculate time until the window resets and the next request can be processed
			const delay = windowStart + windowDuration - now
			setTimeout(processQueue, delay > 0 ? delay : 0)
		}
	}

	return async (req, next) => {
		// Get middleware metadata
		const metadata = getMetadata(req)

		// Check if this is a retry attempt that should skip rate limiting
		// Skip if it's a retry attempt and either:
		// 1. The retry middleware explicitly requested to skip rate limiting, or
		// 2. We're configured to not apply rate limiting to retries
		if (
			metadata.retry?.isRetry &&
			(metadata.retry.skipRateLimit === true || !applyToRetries)
		) {
			// Skip rate limiting for retry attempts
			return next(req)
		}

		return new Promise<Response>((resolve) => {
			const attemptRequest = async () => {
				const now = Date.now()
				if (now - windowStart > windowDuration) {
					requestCount = 0
					windowStart = now
				}

				if (requestCount < maxRequests) {
					requestCount++

					// Update the rate limit metadata
					metadata.rateLimit = {
						remaining: maxRequests - requestCount,
						resetAt: windowStart + windowDuration,
						limit: maxRequests,
						wasQueued: false,
					}

					// Clone the request with updated metadata
					const requestWithMetadata = cloneRequestWithMetadata(req)

					// Execute the next middleware
					const response = await next(requestWithMetadata)

					// Add rate limit info to the response metadata
					const responseMetadata = getMetadata(response)
					responseMetadata.rateLimit = {
						...metadata.rateLimit,
						remaining: maxRequests - requestCount,
					}

					resolve(response)
				} else {
					// Queue the request if rate limit is exceeded
					metadata.rateLimit = {
						remaining: 0,
						resetAt: windowStart + windowDuration,
						limit: maxRequests,
						wasQueued: true,
					}

					requestQueue.push(() => {
						// Re-check conditions when dequeued, as window might have reset
						void attemptRequest() // Explicitly mark as ignored with void operator
					})

					// Ensure the queue is processed if this is the first queued item
					if (requestQueue.length === 1) {
						const delay = windowStart + windowDuration - Date.now()
						setTimeout(processQueue, delay > 0 ? delay : 0)
					}
				}
			}
			void attemptRequest() // Explicitly mark as ignored with void operator
		})
	}
}
