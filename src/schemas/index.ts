/**
 * Central export file for all Zod schemas
 *
 * This file re-exports all schemas from the various modules to provide
 * direct access to schemas without needing to instantiate an API client.
 */

// Utilities
export { mergeShapes } from '../utils/schema-utils'

// --- Base Schemas ---
export { AssetTypeEnum, BaseInstrumentSchema } from './base-instrument.schema'

// Re-export types for TypeScript usage
export type { AssetType, BaseInstrument } from './base-instrument.schema'

// --- Market Data Schemas ---
// Instruments
export {
	InstrumentProjectionEnum,
	GetInstrumentsQueryParams,
	GetInstrumentsParams,
	GetInstrumentsResponse,
	GetInstrumentByCusipPathParams,
	GetInstrumentByCusipParams,
	GetInstrumentByCusipResponse,
} from '../market-data/instruments/schema'

// Market Hours
export {
	MarketHoursMarketQueryEnum,
	GetMarketHoursQueryParams,
	GetMarketHoursParams,
	GetMarketHoursResponse,
	GetMarketHoursByMarketIdPathParams,
	GetMarketHoursByMarketIdQueryParams,
	GetMarketHoursByMarketIdParams,
	GetMarketHoursByMarketIdResponse,
} from '../market-data/marketHours/schema'

// Movers
export {
	MoversDirectionEnum,
	GetMoversPathParams,
	GetMoversQueryParams,
	GetMoversParams,
	GetMoversResponse,
} from '../market-data/movers/schema'

// Options
export {
	ExpirationTypeEnum,
	GetOptionChainQueryParams,
	GetOptionChainParams,
	GetOptionChainResponse,
	GetOptionExpirationChainQueryParams,
	GetOptionExpirationChainParams,
	GetOptionExpirationChainResponse,
} from '../market-data/options/schema'

// Price History
export {
	PeriodEnum,
	FrequencyEnum,
	GetPriceHistoryQueryParams,
	GetPriceHistoryParams,
	GetPriceHistoryResponse,
} from '../market-data/priceHistory/schema'

// Quotes
export {
	GetQuoteBySymbolIdPathParams,
	GetQuoteBySymbolIdQueryParams,
	GetQuoteBySymbolIdParams,
	GetQuoteBySymbolIdResponse,
	GetQuotesQueryParams,
	GetQuotesParams,
	GetQuotesResponse,
} from '../market-data/quotes/schema'

// Shared
export { InstrumentAssetTypeEnum } from '../market-data/shared/instrument-asset-type.schema'

// --- Trader Schemas ---
// Accounts
export {
	GetAccountByNumberPathParams,
	GetAccountByNumberQueryParams,
	GetAccountByNumberParams,
	GetAccountByNumberResponse,
	GetAccountsQueryParams,
	GetAccountsParams,
	GetAccountsResponse,
	GetAccountNumbersParams,
	GetAccountNumbersResponse,
} from '../trader/accounts/schema'

// Orders
export {
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
	GetOrderByIdParams,
	GetOrderByIdResponse,
	CancelOrderPathParams,
	CancelOrderParams,
	CancelOrderResponse,
	ReplaceOrderPathParams,
	ReplaceOrderRequestBody,
	ReplaceOrderParams,
	ReplaceOrderResponse,
} from '../trader/orders/schema'

// Transactions
export {
	TransactionType,
	GetTransactionsPathParams,
	GetTransactionsQueryParams,
	GetTransactionsParams,
	GetTransactionsResponse,
	GetTransactionByIdPathParams,
	GetTransactionByIdParams,
	GetTransactionByIdResponse,
} from '../trader/transactions/schema'

// User Preference
export {
	GetUserPreferenceParams,
	GetUserPreferenceResponse,
} from '../trader/user-preference/schema'

// Shared
export { AccountAPIOptionDeliverable } from '../trader/shared/account-api-option-deliverable.schema'

export { ApiCurrencyType } from '../trader/shared/api-currency-type.schema'

export { assetType } from '../trader/shared/asset-type.schema'
