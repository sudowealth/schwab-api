import { type Middleware } from './compose'

export function withRateLimit(
	maxRequests: number = 120,
	windowMs: number = 60_000,
): Middleware {
	let requestCount = 0
	let windowStart = Date.now()
	const requestQueue: (() => void)[] = []

	const processQueue = () => {
		if (requestQueue.length === 0) return

		const now = Date.now()
		if (now - windowStart > windowMs) {
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
			const delay = windowStart + windowMs - now
			setTimeout(processQueue, delay > 0 ? delay : 0)
		}
	}

	return async (req, next) => {
		return new Promise<Response>((resolve) => {
			const attemptRequest = async () => {
				const now = Date.now()
				if (now - windowStart > windowMs) {
					requestCount = 0
					windowStart = now
				}

				if (requestCount < maxRequests) {
					requestCount++
					resolve(next(req))
				} else {
					// Queue the request if rate limit is exceeded
					requestQueue.push(() => {
						// Re-check conditions when dequeued, as window might have reset
						void attemptRequest() // Explicitly mark as ignored with void operator
					})
					// Ensure the queue is processed if this is the first queued item
					if (requestQueue.length === 1) {
						const delay = windowStart + windowMs - Date.now()
						setTimeout(processQueue, delay > 0 ? delay : 0)
					}
				}
			}
			void attemptRequest() // Explicitly mark as ignored with void operator
		})
	}
}
