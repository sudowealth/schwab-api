import { SchwabAuthError, AuthErrorCode } from '../errors'
import { type TokenSet, type TokenData } from './types'

export interface RefreshDependencies {
	performRefresh: (refreshToken: string) => Promise<TokenSet>
}

export interface RefreshConfig {
	refreshThresholdMs: number
	debug?: boolean
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

		const promise = this.doRefresh(refreshTok)
		this.refreshLock = promise
		try {
			const result = await promise
			return result
		} finally {
			this.refreshLock = null
		}
	}

	private async doRefresh(refreshToken: string): Promise<TokenData> {
		const tokens = await this.deps.performRefresh(refreshToken)
		const data: TokenData = {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		}
		for (const cb of this.callbacks) cb(tokens)
		return data
	}
}
