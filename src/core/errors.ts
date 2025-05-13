export class SchwabApiError extends Error {
	status: number
	body?: unknown // Body could be parsed JSON error details or raw text

	constructor(status: number, body?: unknown, message?: string) {
		super(message || `Schwab API Error: ${status}`)
		this.status = status
		this.body = body
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

// Optional subclasses for more specific error handling (unimplemented)
// export class SchwabAuthError extends SchwabApiError {
//   constructor(body?: unknown, message?: string) {
//     super(401, body, message || "Schwab Authentication Error");
//     Object.setPrototypeOf(this, SchwabAuthError.prototype);
//     this.name = "SchwabAuthError";
//   }
// }

// export class SchwabRateLimitError extends SchwabApiError {
//   constructor(body?: unknown, message?: string) {
//     super(429, body, message || "Schwab Rate Limit Error");
//     Object.setPrototypeOf(this, SchwabRateLimitError.prototype);
//     this.name = "SchwabRateLimitError";
//   }
// }

// export class SchwabInvalidRequestError extends SchwabApiError {
//   constructor(body?: unknown, message?: string) {
//     super(400, body, message || "Schwab Invalid Request Error");
//     Object.setPrototypeOf(this, SchwabInvalidRequestError.prototype);
//     this.name = "SchwabInvalidRequestError";
//   }
// }

// export class SchwabNotFoundError extends SchwabApiError {
//   constructor(body?: unknown, message?: string) {
//     super(404, body, message || "Schwab Not Found Error");
//     Object.setPrototypeOf(this, SchwabNotFoundError.prototype);
//     this.name = "SchwabNotFoundError";
//   }
// }

// export class SchwabServerError extends SchwabApiError {
//   constructor(body?: unknown, message?: string) {
//     super(500, body, message || "Schwab Server Error");
//     Object.setPrototypeOf(this, SchwabServerError.prototype);
//     this.name = "SchwabServerError";
//   }
// }
