import { SchwabAuthError, AuthErrorCode } from '../errors'
import { type TokenRefreshTracer } from './token-refresh-tracer'
import { type TokenSet, type TokenData } from './types'

export interface RefreshDependencies {
	performRefresh: (refreshToken: string) => Promise<TokenSet>
}

export interface RefreshConfig {
	refreshThresholdMs: number
	debug?: boolean
	tracer?: TokenRefreshTracer
	maxRetryAttempts?: number
	initialRetryDelayMs?: number
	backoffMultiplier?: number
}

export class TokenRefreshCoordinator {
	private deps: RefreshDependencies
	private config: RefreshConfig
	private refreshLock: Promise<TokenData> | null = null
	private callbacks: Array<(t: TokenSet) => void> = []

	constructor(deps: RefreshDependencies, config: RefreshConfig) {
		this.deps = deps
		this.config = config
	}

	onRefresh(cb: (t: TokenSet) => void): void {
		this.callbacks.push(cb)
	}

	async refreshIfNeeded(
		tokenData: TokenData | null,
		force = false,
	): Promise<TokenData> {
		if (this.refreshLock) return this.refreshLock
		if (!tokenData)
			throw new SchwabAuthError(
				AuthErrorCode.REFRESH_NEEDED,
				'No token to refresh',
			)

		const shouldRefresh =
			force ||
			(tokenData.expiresAt ?? 0) <= Date.now() + this.config.refreshThresholdMs
		if (!shouldRefresh) return tokenData

		const refreshTok = tokenData.refreshToken
		if (!refreshTok) {
			throw new SchwabAuthError(
				AuthErrorCode.REFRESH_NEEDED,
				'No refresh token available',
			)
		}

		const promise = this.doRefreshWithRetry(refreshTok)
		this.refreshLock = promise
		try {
			const result = await promise
			return result
		} finally {
			this.refreshLock = null
		}
	}

	private async doRefreshWithRetry(refreshToken: string): Promise<TokenData> {
		const {
			maxRetryAttempts = 3,
			initialRetryDelayMs = 500,
			backoffMultiplier = 2,
			tracer,
		} = this.config

		let delay = initialRetryDelayMs
		for (let attempt = 1; attempt <= maxRetryAttempts; attempt++) {
			const start = Date.now()
			try {
				const tokens = await this.deps.performRefresh(refreshToken)
				const data: TokenData = {
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					expiresAt: tokens.expiresAt,
				}
				tracer?.log({
					attempt,
					succeeded: true,
					latencyMs: Date.now() - start,
				})
				for (const cb of this.callbacks) cb(tokens)
				return data
			} catch (err) {
				tracer?.log({
					attempt,
					succeeded: false,
					latencyMs: Date.now() - start,
					error: err,
				})
				if (attempt === maxRetryAttempts) throw err
				await new Promise((r) => setTimeout(r, delay))
				delay *= backoffMultiplier
			}
		}
		/* istanbul ignore next */
		throw new Error('Unreachable')
	}
}
