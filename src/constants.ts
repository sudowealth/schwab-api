/**
 * Central file for all API constants, URLs, and paths
 * This helps avoid duplication and ensures consistency across the codebase
 */

// Base URLs
export const API_URLS = {
	PRODUCTION: 'https://api.schwabapi.com',
	SANDBOX: 'https://api-sandbox.schwabapi.com',
}

// API Versions
export const API_VERSIONS = {
	v1: 'v1',
}

// OAuth endpoints
export const OAUTH_ENDPOINTS = {
	AUTHORIZE: '/oauth/authorize',
	TOKEN: '/oauth/token',
}

// Market Data endpoints
const MARKET_DATA_BASE_PATH = `/marketdata/${API_VERSIONS.v1}`
const INSTRUMENT_BASE_PATH = `${MARKET_DATA_BASE_PATH}/instruments`
const MARKET_HOURS_BASE_PATH = `${MARKET_DATA_BASE_PATH}/markets`
export const MARKET_DATA = {
	QUOTES: {
		GET_QUOTES: `${MARKET_DATA_BASE_PATH}/quotes`,
		GET_QUOTE: `${MARKET_DATA_BASE_PATH}/{symbol_id}/quotes`,
	},
	OPTIONS: {
		GET_OPTION_CHAIN: `${MARKET_DATA_BASE_PATH}/chains`,
		GET_OPTION_EXPIRATION_CHAIN: `${MARKET_DATA_BASE_PATH}/expirationchain`,
	},
	PRICE_HISTORY: {
		GET_PRICE_HISTORY: `${MARKET_DATA_BASE_PATH}/pricehistory`,
	},
	MOVERS: {
		GET_MOVERS: `${MARKET_DATA_BASE_PATH}/movers/{symbol_id}`,
	},
	MARKET_HOURS: {
		GET_HOURS_FOR_MULTIPLE_MARKETS: MARKET_HOURS_BASE_PATH,
		GET_HOURS_FOR_SINGLE_MARKET: `${MARKET_HOURS_BASE_PATH}/{market_id}`,
	},
	INSTRUMENTS: {
		GET_INSTRUMENTS: INSTRUMENT_BASE_PATH,
		GET_INSTRUMENT: `${INSTRUMENT_BASE_PATH}/{cusip_id}`,
	},
}

// Trading endpoints
const TRADER_BASE_PATH = `/trader/${API_VERSIONS.v1}`
const ACCOUNT_BASE_PATH = `${TRADER_BASE_PATH}/accounts/{accountNumber}`
const ACCOUNT_ORDERS_BASE_PATH = `${ACCOUNT_BASE_PATH}/orders`
const ACCOUNT_TRANSACTIONS_BASE_PATH = `${ACCOUNT_BASE_PATH}/transactions`
export const TRADER = {
	ACCOUNTS: {
		GET_ACCOUNTS: `${TRADER_BASE_PATH}/accounts`,
		GET_ACCOUNT: ACCOUNT_BASE_PATH,
		GET_ACCOUNT_NUMBERS: `${TRADER_BASE_PATH}/accounts/accountNumbers`,
	},
	ORDERS: {
		GET_ORDERS: `${TRADER_BASE_PATH}/orders`,
		GET_ORDERS_FOR_ACCOUNT: ACCOUNT_ORDERS_BASE_PATH,
		GET_ORDER: `${ACCOUNT_ORDERS_BASE_PATH}/{orderId}`,
		PLACE_ORDER: ACCOUNT_ORDERS_BASE_PATH,
		REPLACE_ORDER: `${ACCOUNT_ORDERS_BASE_PATH}/{orderId}`,
		CANCEL_ORDER: `${ACCOUNT_ORDERS_BASE_PATH}/{orderId}`,
	},
	TRANSACTIONS: {
		GET_TRANSACTIONS: ACCOUNT_TRANSACTIONS_BASE_PATH,
		GET_TRANSACTION: `${ACCOUNT_TRANSACTIONS_BASE_PATH}/{transactionId}`,
	},
	USER_PREFERENCES: {
		GET_USER_PREFERENCES: `${TRADER_BASE_PATH}/userPreference`,
	},
}

// Media types
export const MEDIA_TYPES = {
	JSON: 'application/json',
	FORM: 'application/x-www-form-urlencoded',
}

// OAuth Grant Types
export const OAUTH_GRANT_TYPES = {
	AUTHORIZATION_CODE: 'authorization_code',
	REFRESH_TOKEN: 'refresh_token',
}

// Environment names
export const ENVIRONMENTS = {
	PRODUCTION: 'production',
	SANDBOX: 'sandbox',
} as const

// Environment type
export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS]

// Default timeout (in ms)
export const TIMEOUTS = {
	DEFAULT_REQUEST: 30000, // 30 seconds
}
