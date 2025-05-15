export type Middleware = (
	req: Request,
	next: (req: Request) => Promise<Response>,
) => Promise<Response>

export function compose(...mws: Middleware[]) {
	return (initial: Request): Promise<Response> => {
		// Ensure fetch is available in the global scope or polyfilled
		const effectiveFetch =
			typeof fetch !== 'undefined' ? fetch : globalThis.fetch
		if (!effectiveFetch) {
			throw new Error(
				'Global fetch is not available. Please provide a fetch polyfill.',
			)
		}

		// Create a fetch function to use as the final handler in the middleware chain
		const fetchHandler = (req: Request): Promise<Response> => {
			return effectiveFetch(req)
		}

		// Use type assertion to handle the complex typing needed for the reducer
		type RequestHandler = (req: Request) => Promise<Response>
		
		// Build middleware chain from right to left (last to first)
		const handler = mws.reduceRight<RequestHandler>(
			(nextHandler, middleware) => {
				// Create a new handler that applies this middleware with the next handler
				return (req: Request): Promise<Response> => {
					return middleware(req, nextHandler)
				}
			},
			fetchHandler // Initial value is the fetch handler (end of chain)
		)

		// Execute the composed handler chain with the initial request
		return handler(initial)
	}
}
