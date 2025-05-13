export class SchwabApiError extends Error {
  status: number;
  body?: unknown; // Body could be parsed JSON error details or raw text
  isSchwabError: true = true; // Discriminator property

  constructor(status: number, body?: unknown, message?: string) {
    super(message || `Schwab API Error: ${status}`);
    this.name = "SchwabApiError"; // Standard practice for custom errors
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, SchwabApiError.prototype); // Ensure instanceof works correctly
  }
}

/**
 * Type guard to check if an error is an instance of SchwabApiError.
 * @param e The error object to check.
 * @returns True if the error is a SchwabApiError, false otherwise.
 */
export const isSchwabApiError = (e: unknown): e is SchwabApiError => {
  return (
    e instanceof SchwabApiError ||
    (typeof e === "object" && e !== null && (e as any).isSchwabError === true)
  );
};

// You might want to add more specific error types if needed, e.g.:
// export class SchwabAuthError extends SchwabApiError {}
// export class SchwabRateLimitError extends SchwabApiError {}
// export class SchwabInvalidRequestError extends SchwabApiError {}
