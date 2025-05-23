import { SchwabAuthError, AuthErrorCode } from '../errors'
import {
	TokenPersistenceEvent,
	type TokenPersistenceEventHandler,
} from './enhanced-token-manager'
import { type TokenData, type TokenSet } from './types'

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
}
