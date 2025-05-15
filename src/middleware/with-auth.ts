import { type TokenSet } from '../auth/types'
import { type Middleware } from '../middleware/compose'

export function withAuth(tokens: {
	current(): TokenSet | null // Allow null if token is not yet available
	refresh(): Promise<TokenSet>
}): Middleware {
	return async (req, next) => {
		let currentToken = tokens.current()

		if (!currentToken) {
			// Potentially handle cases where token is not immediately available
			// For now, if no token, proceed without auth, or throw an error
			// depending on desired behavior. The PRD implies a token should exist.
			console.warn(
				'withAuth: No current token available. Proceeding without authentication.',
			)
			return next(req)
		}

		// Refresh if expiresAt <= now + 60_000 ms (1 minute)
		if (currentToken.expiresAt <= Date.now() + 60_000) {
			try {
				currentToken = await tokens.refresh()
			} catch (error) {
				console.error('withAuth: Failed to refresh token', error)
				// Decide how to handle refresh failure: proceed with old token, or error out.
				// For now, let's throw an error to make it explicit.
				throw new Error('Failed to refresh authentication token.')
			}
		}

		const headers = new Headers(req.headers)
		headers.set('Authorization', `Bearer ${currentToken.accessToken}`)

		const authorizedReq = new Request(req.url, {
			...req,
			headers,
		})

		return next(authorizedReq)
	}
}
