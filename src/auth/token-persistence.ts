import { SchwabAuthError, AuthErrorCode } from '../errors'
import {
	TokenPersistenceEvent,
	type TokenPersistenceEventHandler,
} from './enhanced-token-manager'
import { type TokenData, type TokenSet, type TokenSnapshot } from './types'

export interface PersistenceOptions {
	save?: (tokens: TokenSet) => Promise<void>
	load?: () => Promise<TokenSet | null>
	validate?: boolean
	onEvent?: TokenPersistenceEventHandler
	debug?: boolean
}

export class TokenPersistence {
	private saveFn?: (tokens: TokenSet) => Promise<void>
	private loadFn?: () => Promise<TokenSet | null>
	private validate: boolean
	private eventHandler?: TokenPersistenceEventHandler
	private debug: boolean
	public readonly key: string = 'schwab-auth-tokens'

	constructor(opts: PersistenceOptions) {
		this.saveFn = opts.save
		this.loadFn = opts.load
		this.validate = opts.validate !== false
		this.eventHandler = opts.onEvent
		this.debug = !!opts.debug
	}

	async load(): Promise<TokenData | null> {
		if (!this.loadFn) return null
		try {
			const tokens = await this.loadFn()
			if (!tokens) return null
			this.eventHandler?.(TokenPersistenceEvent.TOKEN_LOADED, tokens)
			return tokens
		} catch (err) {
			this.eventHandler?.(
				TokenPersistenceEvent.TOKEN_LOAD_FAILED,
				{ accessToken: '', refreshToken: '', expiresAt: 0 },
				{ error: err },
			)
			throw new SchwabAuthError(
				AuthErrorCode.TOKEN_PERSISTENCE_LOAD_FAILED,
				'Failed to load tokens',
				undefined,
				{ err },
			)
		}
	}

	async read(): Promise<TokenSnapshot | null> {
		const data = await this.load()
		if (!data) return null

		// Convert TokenData to TokenSnapshot format
		return {
			access_token: data.accessToken,
			refresh_token: data.refreshToken,
			expires_at: data.expiresAt
				? Math.floor(data.expiresAt / 1000)
				: undefined,
			issued_at: data.expiresAt
				? Math.floor((data.expiresAt - 3600 * 1000) / 1000)
				: undefined,
		}
	}

	async save(tokens: TokenSet, metadata?: Record<string, any>): Promise<void> {
		if (!this.saveFn) return
		try {
			await this.saveFn(tokens)
			this.eventHandler?.(TokenPersistenceEvent.TOKEN_SAVED, tokens, metadata)
		} catch (err) {
			this.eventHandler?.(TokenPersistenceEvent.TOKEN_SAVE_FAILED, tokens, {
				error: err,
			})
			throw err
		}
	}

	async write(snapshot: TokenSnapshot): Promise<void> {
		// Convert TokenSnapshot to TokenSet format
		const tokens: TokenSet = {
			accessToken: snapshot.access_token || '',
			refreshToken: snapshot.refresh_token || '',
			expiresAt: snapshot.expires_at
				? snapshot.expires_at * 1000
				: Date.now() + 3600 * 1000,
		}
		await this.save(tokens)
	}
}
