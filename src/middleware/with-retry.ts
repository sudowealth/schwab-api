import { type Middleware } from './compose'

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_MS = 1000
const JITTER_FACTOR = 0.1 // 10% jitter

export function withRetry(opts?: {
	max?: number
	baseMs?: number
}): Middleware {
	const maxRetries = opts?.max ?? DEFAULT_MAX_RETRIES
	const baseDelayMs = opts?.baseMs ?? DEFAULT_BASE_MS

	return async (req, next) => {
		let lastError: Error | undefined
		let attempts = 0

		while (attempts <= maxRetries) {
			try {
				const response = await next(req.clone()) // Clone request as body can be consumed

				if (response.status === 429 || response.status >= 500) {
					// Retry on 429 (Too Many Requests) or 5xx server errors
					if (attempts === maxRetries) {
						return response // Max retries reached, return the last response
					}

					lastError = new Error(`Request failed with status ${response.status}`)
					// Consume the response body to free up resources, even if not used
					if (response.body) {
						try {
							await response.text()
						} catch (e) {
							// Ignore errors from consuming the body
						}
					}
				} else {
					return response // Successful response or non-retryable error
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error))
				if (attempts === maxRetries) {
					throw lastError // Max retries reached, throw the last error
				}
			}

			attempts++
			if (attempts > maxRetries) break

			// Exponential backoff with jitter
			const delay = baseDelayMs * Math.pow(2, attempts - 1)
			const jitter = delay * JITTER_FACTOR * (Math.random() - 0.5) * 2 // -10% to +10%
			const totalDelay = Math.max(0, delay + jitter)

			await new Promise((resolve) => setTimeout(resolve, totalDelay))
		}

		// Should not be reached if logic is correct, but as a fallback:
		if (lastError) throw lastError
		// This line should ideally not be hit if the loop and conditions are correct.
		// If it is, it means a state was reached that wasn't expected.
		// For instance, if maxRetries is 0, the loop might not behave as expected.
		// Consider maxRetries=0 means 1 attempt.
		throw new Error('withRetry: Exited retry loop unexpectedly.')
	}
}
