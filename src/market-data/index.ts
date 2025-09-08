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
 * // Use client.marketData.quotes etc.
 * ```
 */

export * as instruments from './instruments/index.js'
export * as marketHours from './marketHours/index.js'
export * as movers from './movers/index.js'
export * as options from './options/index.js'
export * as priceHistory from './priceHistory/index.js'
export * as quotes from './quotes/index.js'
export * as shared from './shared/index.js'
