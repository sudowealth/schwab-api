/**
 * @internal
 *
 * This module is for internal use only. Consumers should use the public API
 * exposed through the `createApiClient` function instead of importing directly
 * from this module.
 *
 * Example:
 * ```
 * import { createApiClient } from 'schwab-api'
 * const client = createApiClient({ config: {}, auth: '' })
 * // Use client.trader.accounts etc.
 * ```
 */

export * as accounts from './accounts'
export * as orders from './orders'
export * as transactions from './transactions'
export * as userPreference from './user-preference'
export * as shared from './shared'
