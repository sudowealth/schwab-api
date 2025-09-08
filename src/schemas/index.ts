/**
 * Central export file for all Zod schemas
 *
 * This file re-exports all schemas from the various modules to provide
 * direct access to schemas without needing to instantiate an API client.
 */

// Utilities
export { mergeShapes } from '../utils/schema-utils.js'

// --- Base Schemas ---
export {
	AssetTypeEnum,
	BaseInstrumentSchema,
} from './base-instrument.schema.js'

// Re-export types for TypeScript usage
export type { AssetType, BaseInstrument } from './base-instrument.schema.js'

// --- Market Data Schemas ---
// Instruments
export {
	InstrumentProjectionEnum,
	GetInstrumentsPathParams,
	GetInstrumentsQueryParams,
	GetInstrumentsParams,
	GetInstrumentsResponse,
	GetInstrumentByCusipPathParams,
	GetInstrumentByCusipQueryParams,
	GetInstrumentByCusipParams,
	GetInstrumentByCusipResponse,
} from '../market-data/instruments/schema.js'

// Market Hours
export {
	MarketHoursMarketQueryEnum,
	GetMarketHoursPathParams,
	GetMarketHoursQueryParams,
	GetMarketHoursParams,
	GetMarketHoursResponse,
	GetMarketHoursByMarketIdPathParams,
	GetMarketHoursByMarketIdQueryParams,
	GetMarketHoursByMarketIdParams,
	GetMarketHoursByMarketIdResponse,
} from '../market-data/marketHours/schema.js'

// Movers
export {
	MoversDirectionEnum,
	GetMoversPathParams,
	GetMoversQueryParams,
	GetMoversParams,
	GetMoversResponse,
} from '../market-data/movers/schema.js'

// Options
export {
	ExpirationTypeEnum,
	GetOptionChainPathParams,
	GetOptionChainQueryParams,
	GetOptionChainParams,
	GetOptionChainResponse,
	GetOptionExpirationChainPathParams,
	GetOptionExpirationChainQueryParams,
	GetOptionExpirationChainParams,
	GetOptionExpirationChainResponse,
} from '../market-data/options/schema.js'

// Price History
export {
	PeriodEnum,
	FrequencyEnum,
	GetPriceHistoryPathParams,
	GetPriceHistoryQueryParams,
	GetPriceHistoryParams,
	GetPriceHistoryResponse,
} from '../market-data/priceHistory/schema.js'

// Quotes
export {
	GetQuoteBySymbolIdPathParams,
	GetQuoteBySymbolIdQueryParams,
	GetQuoteBySymbolIdParams,
	GetQuoteBySymbolIdResponse,
	GetQuotesPathParams,
	GetQuotesQueryParams,
	GetQuotesParams,
	GetQuotesResponse,
} from '../market-data/quotes/schema.js'

// Shared
export { InstrumentAssetTypeEnum } from '../market-data/shared/instrument-asset-type.schema.js'

// --- Trader Schemas ---
// Accounts
export {
	GetAccountByNumberPathParams,
	GetAccountByNumberQueryParams,
	GetAccountByNumberParams,
	GetAccountByNumberResponse,
	GetAccountsPathParams,
	GetAccountsQueryParams,
	GetAccountsParams,
	GetAccountsResponse,
	GetAccountNumbersPathParams,
	GetAccountNumbersQueryParams,
	GetAccountNumbersParams,
	GetAccountNumbersResponse,
} from '../trader/accounts/schema.js'

// Orders
export {
	GetOrdersPathParams,
	GetOrdersQueryParams,
	GetOrdersParams,
	GetOrdersResponse,
	GetOrdersByAccountPathParams,
	GetOrdersByAccountQueryParams,
	GetOrdersByAccountParams,
	GetOrdersByAccountResponse,
	PlaceOrderPathParams,
	PlaceOrderRequestBody,
	PlaceOrderParams,
	PlaceOrderResponse,
	GetOrderByIdPathParams,
	GetOrderByIdQueryParams,
	GetOrderByIdParams,
	GetOrderByIdResponse,
	CancelOrderPathParams,
	CancelOrderQueryParams,
	CancelOrderParams,
	CancelOrderResponse,
	ReplaceOrderPathParams,
	ReplaceOrderRequestBody,
	ReplaceOrderParams,
	ReplaceOrderResponse,
} from '../trader/orders/schema.js'

// Transactions
export {
	TransactionType,
	GetTransactionsPathParams,
	GetTransactionsQueryParams,
	GetTransactionsParams,
	GetTransactionsResponse,
	GetTransactionByIdPathParams,
	GetTransactionByIdQueryParams,
	GetTransactionByIdParams,
	GetTransactionByIdResponse,
} from '../trader/transactions/schema.js'

// User Preference
export {
	GetUserPreferencePathParams,
	GetUserPreferenceQueryParams,
	GetUserPreferenceParams,
	GetUserPreferenceResponse,
} from '../trader/user-preference/schema.js'

// Shared
export { AccountAPIOptionDeliverable } from '../trader/shared/account-api-option-deliverable.schema.js'

export { ApiCurrencyType } from '../trader/shared/api-currency-type.schema.js'

export { assetType } from '../trader/shared/asset-type.schema.js'
