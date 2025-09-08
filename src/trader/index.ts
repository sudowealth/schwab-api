/**
 * @internal
 *
 * This module is for internal use only. Consumers should use the public API
 * exposed through the `createApiClient` function instead of importing directly
 * from this module.
 *
 * Example:
 * ```
 * import { createApiClient } from '@sudowealth/schwab-api'
 * const client = createApiClient({ config: {}, auth: '' })
 * // Use client.trader.accounts etc.
 * ```
 */

export * as accounts from './accounts/index.js'
export * as orders from './orders/index.js'
export * as transactions from './transactions/index.js'
export * as userPreference from './user-preference/index.js'
export * as shared from './shared/index.js'
