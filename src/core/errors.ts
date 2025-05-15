import { z } from 'zod'

export { SchwabAuthError } from '../auth/errors'

export class SchwabApiError extends Error {
	status: number
	body?: unknown // Body could be parsed JSON error details or raw text

	constructor(status: number, body?: unknown, message?: string) {
		super(message || `Schwab API Error: ${status}`)
		this.status = status
		this.body = body
		this.name = 'SchwabApiError'
		Object.setPrototypeOf(this, SchwabApiError.prototype) // Ensure instanceof works correctly
	}
}

/**
 * Type guard to check if an error is an instance of SchwabApiError.
 * @param e The error object to check.
 * @returns True if the error is a SchwabApiError, false otherwise.
 */
export const isSchwabApiError = (e: unknown): e is SchwabApiError =>
	e instanceof SchwabApiError

export class SchwabRateLimitError extends SchwabApiError {
	constructor(body?: unknown, message?: string) {
		super(429, body, message || 'Schwab Rate Limit Error')
		this.name = 'SchwabRateLimitError'
		Object.setPrototypeOf(this, SchwabRateLimitError.prototype)
	}
}

export class SchwabAuthorizationError extends SchwabApiError {
	constructor(body?: unknown, message?: string) {
		super(401, body, message || 'Schwab Authorization Error')
		this.name = 'SchwabAuthorizationError'
		Object.setPrototypeOf(this, SchwabAuthorizationError.prototype)
	}
}

export class SchwabInvalidRequestError extends SchwabApiError {
	constructor(body?: unknown, message?: string) {
		super(400, body, message || 'Schwab Invalid Request Error')
		this.name = 'SchwabInvalidRequestError'
		Object.setPrototypeOf(this, SchwabInvalidRequestError.prototype)
	}
}

export class SchwabNotFoundError extends SchwabApiError {
	constructor(body?: unknown, message?: string) {
		super(404, body, message || 'Schwab Not Found Error')
		this.name = 'SchwabNotFoundError'
		Object.setPrototypeOf(this, SchwabNotFoundError.prototype)
	}
}

export class SchwabServerError extends SchwabApiError {
	constructor(body?: unknown, message?: string) {
		super(500, body, message || 'Schwab Server Error')
		this.name = 'SchwabServerError'
		Object.setPrototypeOf(this, SchwabServerError.prototype)
	}
}

/**
 * Utility function to create the appropriate error based on status code
 */
export function createSchwabApiError(
	status: number,
	body?: unknown,
	message?: string,
): SchwabApiError {
	switch (status) {
		case 400:
			return new SchwabInvalidRequestError(body, message)
		case 401:
			return new SchwabAuthorizationError(body, message)
		case 404:
			return new SchwabNotFoundError(body, message)
		case 429:
			return new SchwabRateLimitError(body, message)
		case 500:
		case 502:
		case 503:
		case 504:
			return new SchwabServerError(body, message)
		default:
			return new SchwabApiError(status, body, message)
	}
}

const ErrorSourceSchema = z.object({
	pointer: z.array(z.string()).optional(),
	parameter: z.string().optional(),
	header: z.string().optional(),
})

const ErrorSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['400', '401', '404', '500']),
	title: z.string(),
	detail: z.string(),
	source: ErrorSourceSchema.optional(),
})

export const ErrorResponseSchema = z.object({
	errors: z.array(ErrorSchema),
})
export type ErrorResponseSchema = z.infer<typeof ErrorResponseSchema>
