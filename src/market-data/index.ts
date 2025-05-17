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
 * // Use client.marketData.quotes etc.
 * ```
 */

export * as instruments from './instruments'
export * as marketHours from './marketHours'
export * as movers from './movers'
export * as options from './options'
export * as priceHistory from './priceHistory'
export * as quotes from './quotes'
export * as shared from './shared'
