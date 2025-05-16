import { Mutex } from 'async-mutex'
import { type TokenSet } from './types'

/**
 * Service interface for token operations
 */
export interface TokenService {
	/**
	 * Refreshes an access token using the provided refresh token
	 * @param refreshToken The refresh token to use
	 * @param onSuccessfulPersist Optional callback that runs after successful refresh but before returning
	 * @returns A new token set
	 */
	refresh(
		refreshToken: string,
		onSuccessfulPersist?: (token: TokenSet) => Promise<void>,
	): Promise<TokenSet>
}

/**
 * Manages token lifecycle with automatic refresh and concurrency control
 */
export class TokenManager {
	private token: TokenSet
	private refreshMutex = new Mutex()
	private refreshPromise: Promise<void> | null = null

	/**
	 * Creates a new TokenManager instance
	 * @param initial Initial token set
	 * @param service Service that handles token operations
	 */
	constructor(
		initial: TokenSet,
		private service: TokenService,
	) {
		this.token = initial
	}

	/**
	 * Gets a valid access token, refreshing it if needed
	 * @returns A valid access token
	 */
	async getAccessToken(): Promise<string> {
		// If token is still valid (with 1 minute buffer), return it
		if (Date.now() < this.token.expiresAt - 60_000)
			return this.token.accessToken

		// Otherwise refresh it
		await this.refresh()
		return this.token.accessToken
	}

	/**
	 * Forces a token refresh regardless of expiration
	 */
	async forceRefresh(): Promise<void> {
		await this.refresh()
	}

	/**
	 * Gets a copy of the current token set
	 * @returns A copy of the current token set
	 */
	getTokenSet(): TokenSet {
		return { ...this.token }
	}

	private async refresh(): Promise<void> {
		// Use the mutex to prevent multiple concurrent refresh attempts
		await this.refreshMutex.runExclusive(async () => {
			// Double-check expiration inside the mutex lock
			// Another thread might have refreshed the token while we were waiting
			if (Date.now() < this.token.expiresAt - 60_000) return

			// If there's already a refresh in progress, wait for it
			if (this.refreshPromise) {
				await this.refreshPromise
				return
			}

			// Create the promise before any await to ensure it's captured
			this.refreshPromise = this.performRefresh()

			try {
				await this.refreshPromise
			} finally {
				this.refreshPromise = null
			}
		})
	}

	private async performRefresh(): Promise<void> {
		try {
			const newToken = await this.service.refresh(
				this.token.refreshToken,
				async (updatedToken) => {
					// Only update the token after successful persistence
					this.token = updatedToken
				},
			)

			// Update token if no persistence callback was provided
			if (!newToken.refreshToken) {
				newToken.refreshToken = this.token.refreshToken
			}

			this.token = newToken
		} catch (error) {
			// Log the error but don't expose internal details
			console.error('Token refresh failed:', error)
			throw error
		}
	}
}
