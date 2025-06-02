import { type SchwabApiClient } from '../create-api-client'
import { createLogger } from './secure-logger'

const logger = createLogger('AccountScrubber')

/**
 * Mapping of account identifiers to display-friendly names
 */
export type AccountDisplayMap = Record<string, string>

/**
 * Configuration options for the account scrubber
 */
export interface AccountScrubberOptions {
	/**
	 * Pre-built display map to use instead of fetching from API
	 */
	displayMap?: AccountDisplayMap

	/**
	 * Additional field names to scrub (beyond the defaults)
	 */
	scrubFields?: string[]

	/**
	 * Text to replace scrubbed values with
	 * @default "Account Display"
	 */
	replaceWith?: string
}

/**
 * Type for unknown data after scrubbing
 * Removes accountNumber and hashValue fields, adds accountDisplay
 */
type UnknownScrubbed<T> =
	T extends Array<infer U>
		? UnknownScrubbed<U>[]
		: T extends object
			? {
					[K in keyof T as K extends 'accountNumber' | 'hashValue'
						? never
						: K]: UnknownScrubbed<T[K]>
				} & {
					accountDisplay?: string
				}
			: T

/**
 * Default fields to scrub from responses
 */
const DEFAULT_SCRUB_FIELDS = ['accountNumber', 'hashValue']

/**
 * Build a mapping of account identifiers to human-friendly display strings.
 * The mapping includes both raw account numbers and hashed account numbers.
 *
 * @param client - The Schwab API client instance
 * @returns Promise resolving to the account display map
 *
 * @example
 * ```typescript
 * const displayMap = await buildAccountDisplayMap(client);
 * // Returns: { '12345': 'My Trading Account XXXX5', 'hash123': 'My Trading Account XXXX5' }
 * ```
 */
export async function buildAccountDisplayMap(
	client: SchwabApiClient,
): Promise<AccountDisplayMap> {
	try {
		const [userPref, accountNumbers] = await Promise.all([
			client.trader.userPreference.getUserPreference(),
			client.trader.accounts.getAccountNumbers(),
		])

		const prefMap = new Map<string, string>()

		// Build preference map from user preferences
		if (userPref.accounts && Array.isArray(userPref.accounts)) {
			for (const acc of userPref.accounts) {
				if (acc.accountNumber) {
					const displayName = `${acc.nickName || 'Account'} ${acc.displayAcctId || ''}`
					prefMap.set(acc.accountNumber, displayName.trim())
				}
			}
		}

		// Build final display map
		const map: AccountDisplayMap = {}

		if (accountNumbers && Array.isArray(accountNumbers)) {
			for (const acc of accountNumbers) {
				const display =
					prefMap.get(acc.accountNumber) ?? `Account ${acc.accountNumber}`

				// Map both account number and hash value to the same display
				map[acc.accountNumber] = display
				if (acc.hashValue) {
					map[acc.hashValue] = display
				}
			}
		}

		logger.debug('Built account display map', {
			accountCount: Object.keys(map).length / 2, // Divide by 2 since we map both number and hash
		})

		return map
	} catch (error) {
		logger.error('Failed to build account display map', error)
		throw error
	}
}

/**
 * Recursively scrub account identifiers from the provided data object.
 * Any property named "accountNumber" or "hashValue" will be removed and
 * replaced with an "accountDisplay" property using the provided display map.
 *
 * @param data - The data to scrub
 * @param displayMap - Mapping of account identifiers to display names
 * @param options - Additional scrubbing options
 * @returns The scrubbed data with account identifiers replaced
 *
 * @example
 * ```typescript
 * const data = { accountNumber: '12345', balance: 1000 };
 * const scrubbed = scrubAccountIdentifiers(data, displayMap);
 * // Returns: { accountDisplay: 'My Trading Account XXXX5', balance: 1000 }
 * ```
 */
export function scrubAccountIdentifiers<T>(
	data: T,
	displayMap: AccountDisplayMap,
	options?: Pick<AccountScrubberOptions, 'scrubFields' | 'replaceWith'>,
): UnknownScrubbed<T> {
	const scrubFields = [...DEFAULT_SCRUB_FIELDS, ...(options?.scrubFields || [])]

	function scrub(value: any): any {
		if (value === null || value === undefined) {
			return value
		}

		if (Array.isArray(value)) {
			return value.map((item) => scrub(item))
		}

		if (value && typeof value === 'object') {
			const result: Record<string, any> = {}
			let accountDisplay: string | undefined

			// First pass: look for account identifiers
			for (const [key, val] of Object.entries(value)) {
				if (scrubFields.includes(key) && typeof val === 'string') {
					const display = displayMap[val]
					if (display) {
						accountDisplay = display
					}
					// Don't copy the field to result (effectively removing it)
				} else {
					result[key] = scrub(val)
				}
			}

			// Add accountDisplay if we found an account identifier
			if (accountDisplay) {
				result.accountDisplay = accountDisplay
			}

			return result
		}

		// For string values, check if they're account identifiers
		if (typeof value === 'string' && displayMap[value]) {
			return displayMap[value]
		}

		return value
	}

	return scrub(data) as UnknownScrubbed<T>
}

/**
 * Account scrubber class for stateful scrubbing operations
 */
export class AccountScrubber {
	private displayMap: AccountDisplayMap
	private scrubFields: string[]
	private replaceWith: string

	constructor(options: AccountScrubberOptions = {}) {
		this.displayMap = options.displayMap || {}
		this.scrubFields = [...DEFAULT_SCRUB_FIELDS, ...(options.scrubFields || [])]
		this.replaceWith = options.replaceWith || 'Account Display'
	}

	/**
	 * Update the display map
	 */
	setDisplayMap(displayMap: AccountDisplayMap): void {
		this.displayMap = displayMap
	}

	/**
	 * Add additional fields to scrub
	 */
	addScrubFields(...fields: string[]): void {
		this.scrubFields.push(...fields)
	}

	/**
	 * Scrub data using the instance's configuration
	 */
	scrub<T>(data: T): UnknownScrubbed<T> {
		return scrubAccountIdentifiers(data, this.displayMap, {
			scrubFields: this.scrubFields,
			replaceWith: this.replaceWith,
		})
	}

	/**
	 * Build display map from API client and update instance
	 */
	async buildAndSetDisplayMap(
		client: SchwabApiClient,
	): Promise<AccountDisplayMap> {
		const map = await buildAccountDisplayMap(client)
		this.displayMap = map
		return map
	}
}

/**
 * Create a pre-configured account scrubber instance
 */
export function createAccountScrubber(
	options?: AccountScrubberOptions,
): AccountScrubber {
	return new AccountScrubber(options)
}
