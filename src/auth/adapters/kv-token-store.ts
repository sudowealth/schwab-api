import { createLogger } from '../../utils/secure-logger'
import { type TokenData } from '../types'

const logger = createLogger('KVTokenStore')

/**
 * Cloudflare KV namespace interface
 * This matches the actual KV API from Cloudflare Workers
 */
export interface KVNamespace {
	get(key: string): Promise<string | null>
	put(
		key: string,
		value: string,
		options?: { expirationTtl?: number },
	): Promise<void>
	delete(key: string): Promise<void>
}

/**
 * Token identifiers for key generation
 */
export interface TokenIdentifiers {
	/**
	 * Schwab user ID (preferred identifier)
	 */
	schwabUserId?: string

	/**
	 * OAuth client ID (fallback identifier)
	 */
	clientId?: string

	/**
	 * Custom identifier
	 */
	customId?: string
}

/**
 * Configuration options for KV token store
 */
export interface KVTokenStoreOptions {
	/**
	 * Prefix for all keys in KV
	 * @default 'token:'
	 */
	keyPrefix?: string

	/**
	 * TTL for tokens in seconds
	 * @default 2678400 (31 days)
	 */
	ttl?: number

	/**
	 * Whether to automatically migrate tokens between keys
	 * @default true
	 */
	autoMigrate?: boolean
}

/**
 * Default TTL of 31 days in seconds
 */
const DEFAULT_TTL = 31 * 24 * 60 * 60

/**
 * Token store implementation for Cloudflare KV
 *
 * This provides a robust token persistence layer with:
 * - Consistent key generation
 * - Automatic token migration
 * - TTL management
 * - Atomic operations
 *
 * @example
 * ```typescript
 * const store = new KVTokenStore(env.OAUTH_KV);
 *
 * // Use with EnhancedTokenManager
 * const auth = new EnhancedTokenManager({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'your-redirect-uri',
 *   load: () => store.load({ clientId: 'your-client-id' }),
 *   save: (tokens) => store.save({ clientId: 'your-client-id' }, tokens)
 * });
 * ```
 */
export class KVTokenStore {
	private readonly kv: KVNamespace
	private readonly keyPrefix: string
	private readonly ttl: number
	private readonly autoMigrate: boolean

	constructor(kv: KVNamespace, options: KVTokenStoreOptions = {}) {
		this.kv = kv
		this.keyPrefix = options.keyPrefix || 'token:'
		this.ttl = options.ttl || DEFAULT_TTL
		this.autoMigrate = options.autoMigrate !== false
	}

	/**
	 * Generate a consistent KV key from token identifiers
	 * Priority: customId > schwabUserId > clientId
	 *
	 * @param ids Token identifiers
	 * @returns The generated key
	 * @throws Error if no identifier is provided
	 */
	generateKey(ids: TokenIdentifiers): string {
		const identifier = ids.customId || ids.schwabUserId || ids.clientId

		if (!identifier) {
			throw new Error(
				'Token identifiers must include customId, schwabUserId, or clientId',
			)
		}

		return `${this.keyPrefix}${identifier}`
	}

	/**
	 * Load tokens from KV storage
	 * Automatically handles migration between different key schemes
	 *
	 * @param ids Token identifiers to load
	 * @returns Token data if found, null otherwise
	 */
	async load(ids: TokenIdentifiers): Promise<TokenData | null> {
		try {
			// Build list of keys to check in priority order
			const keysToCheck: string[] = []

			if (ids.customId) {
				keysToCheck.push(this.generateKey({ customId: ids.customId }))
			}
			if (ids.schwabUserId) {
				keysToCheck.push(this.generateKey({ schwabUserId: ids.schwabUserId }))
			}
			if (ids.clientId) {
				keysToCheck.push(this.generateKey({ clientId: ids.clientId }))
			}

			// Remove duplicates while preserving order
			const uniqueKeys = [...new Set(keysToCheck)]

			logger.debug('Loading tokens from KV', {
				keysChecked: uniqueKeys.length,
				keys: uniqueKeys.map((k) => this.sanitizeKeyForLog(k)),
			})

			// Try each key in order
			for (const key of uniqueKeys) {
				const value = await this.kv.get(key)

				if (value) {
					try {
						const tokenData = JSON.parse(value) as TokenData

						// If we found tokens under a non-primary key and auto-migrate is enabled
						if (
							this.autoMigrate &&
							key !== uniqueKeys[0] &&
							uniqueKeys.length > 1
						) {
							logger.info('Auto-migrating token to primary key', {
								from: this.sanitizeKeyForLog(key),
								to: this.sanitizeKeyForLog(uniqueKeys[0]!),
							})

							// Migrate to the primary key
							await this.kv.put(uniqueKeys[0]!, value, {
								expirationTtl: this.ttl,
							})
							await this.kv.delete(key)
						}

						logger.debug('Token loaded successfully', {
							key: this.sanitizeKeyForLog(key),
							hasRefreshToken: !!tokenData.refreshToken,
						})

						return tokenData
					} catch (error) {
						logger.error('Failed to parse token data', {
							key: this.sanitizeKeyForLog(key),
							error,
						})
						// Continue to next key
					}
				}
			}

			logger.debug('No tokens found in KV')
			return null
		} catch (error) {
			logger.error('Failed to load tokens from KV', error)
			return null
		}
	}

	/**
	 * Save tokens to KV storage
	 *
	 * @param ids Token identifiers for key generation
	 * @param tokens Token data to save
	 */
	async save(ids: TokenIdentifiers, tokens: TokenData): Promise<void> {
		try {
			const key = this.generateKey(ids)
			const serialized = JSON.stringify(tokens)

			await this.kv.put(key, serialized, { expirationTtl: this.ttl })

			logger.debug('Token saved to KV', {
				key: this.sanitizeKeyForLog(key),
				hasRefreshToken: !!tokens.refreshToken,
			})
		} catch (error) {
			logger.error('Failed to save token to KV', error)
			throw error
		}
	}

	/**
	 * Delete tokens from KV storage
	 *
	 * @param ids Token identifiers for key generation
	 */
	async delete(ids: TokenIdentifiers): Promise<void> {
		try {
			const key = this.generateKey(ids)
			await this.kv.delete(key)

			logger.debug('Token deleted from KV', {
				key: this.sanitizeKeyForLog(key),
			})
		} catch (error) {
			logger.error('Failed to delete token from KV', error)
			throw error
		}
	}

	/**
	 * Migrate tokens from one key to another
	 *
	 * @param fromIds Source token identifiers
	 * @param toIds Destination token identifiers
	 * @returns True if migration was successful, false if source not found
	 */
	async migrate(
		fromIds: TokenIdentifiers,
		toIds: TokenIdentifiers,
	): Promise<boolean> {
		try {
			const fromKey = this.generateKey(fromIds)
			const toKey = this.generateKey(toIds)

			if (fromKey === toKey) {
				logger.debug('Migration not needed - keys are identical')
				return true
			}

			// Check if destination already exists
			const existingAtDestination = await this.kv.get(toKey)
			if (existingAtDestination) {
				logger.debug('Token already exists at destination', {
					toKey: this.sanitizeKeyForLog(toKey),
				})

				// Clean up source if it exists
				try {
					await this.kv.delete(fromKey)
				} catch (error) {
					logger.debug(
						'Failed to cleanup source after finding existing destination',
						error,
					)
				}

				return false
			}

			// Load from source
			const sourceData = await this.kv.get(fromKey)
			if (!sourceData) {
				logger.debug('No token found at source', {
					fromKey: this.sanitizeKeyForLog(fromKey),
				})
				return false
			}

			// Atomically migrate: write to destination first
			await this.kv.put(toKey, sourceData, { expirationTtl: this.ttl })

			// Then delete source
			try {
				await this.kv.delete(fromKey)
			} catch (error) {
				logger.warn('Failed to delete source key after migration', {
					fromKey: this.sanitizeKeyForLog(fromKey),
					error,
				})
			}

			logger.info('Token migrated successfully', {
				from: this.sanitizeKeyForLog(fromKey),
				to: this.sanitizeKeyForLog(toKey),
			})

			return true
		} catch (error) {
			logger.error('Token migration failed', error)
			return false
		}
	}

	/**
	 * Create load and save functions bound to specific identifiers
	 * This is useful for integration with EnhancedTokenManager
	 *
	 * @param ids Token identifiers to bind
	 * @returns Object with bound load and save functions
	 */
	createBoundFunctions(ids: TokenIdentifiers): {
		load: () => Promise<TokenData | null>
		save: (tokens: TokenData) => Promise<void>
	} {
		return {
			load: () => this.load(ids),
			save: (tokens: TokenData) => this.save(ids, tokens),
		}
	}

	/**
	 * Sanitize a key for logging (show prefix and suffix only)
	 */
	private sanitizeKeyForLog(key: string): string {
		if (key.length <= 15) return key
		return `${key.substring(0, 10)}...${key.substring(key.length - 5)}`
	}
}

/**
 * Create a KV token store with default options
 *
 * @param kv KV namespace
 * @param options Optional configuration
 * @returns Configured KV token store instance
 */
export function createKVTokenStore(
	kv: KVNamespace,
	options?: KVTokenStoreOptions,
): KVTokenStore {
	return new KVTokenStore(kv, options)
}
