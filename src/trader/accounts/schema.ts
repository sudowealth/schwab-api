import { z } from 'zod'
import { mergeShapes } from '../../utils/schema-utils'
import { assetType, AccountAPIOptionDeliverable } from '../shared'

export const AccountsBaseInstrument = z.object({
	assetType: assetType,
	cusip: z.string().optional(), // Made optional based on some TransactionInstrument variations
	symbol: z.string(),
	description: z.string().optional(),
	instrumentId: z.number().int().optional(),
	netChange: z.number().optional(),
})
type AccountsBaseInstrument = z.infer<typeof AccountsBaseInstrument>

const AccountCashEquivalent = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.CASH_EQUIVALENT),
	type: z
		.enum(['SWEEP_VEHICLE', 'SAVINGS', 'MONEY_MARKET_FUND', 'UNKNOWN'])
		.optional(),
	underlyingSymbol: z.string().optional(),
})
type AccountCashEquivalent = z.infer<typeof AccountCashEquivalent>

const AccountEquity = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.EQUITY),
})
type AccountEquity = z.infer<typeof AccountEquity>

const AccountFixedIncome = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.FIXED_INCOME),
	maturityDate: z.string().datetime().optional(),
	factor: z.number().optional(),
	variableRate: z.number().optional(),
})
type AccountFixedIncome = z.infer<typeof AccountFixedIncome>

const AccountMutualFund = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.MUTUAL_FUND),
})
type AccountMutualFund = z.infer<typeof AccountMutualFund>

const AccountOption = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.OPTION),
	optionDeliverables: z
		.array(z.lazy(() => AccountAPIOptionDeliverable))
		.optional(),
	putCall: z.enum(['PUT', 'CALL', 'UNKNOWN']).optional(),
	optionMultiplier: z.number().int().optional(),
	type: z.enum(['VANILLA', 'BINARY', 'BARRIER', 'UNKNOWN']).optional(),
	underlyingSymbol: z.string().optional(), // Added as it's common for options
})
type AccountOption = z.infer<typeof AccountOption>

const AccountFuture = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.FUTURE),
	expirationDate: z.string().datetime().optional(),
	activeContract: z.boolean().default(false).optional(),
})
type AccountFuture = z.infer<typeof AccountFuture>

const AccountForex = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.FOREX),
})
type AccountForex = z.infer<typeof AccountForex>

const AccountIndex = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.INDEX),
})
type AccountIndex = z.infer<typeof AccountIndex>

const AccountProduct = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.PRODUCT), // Assuming PRODUCT is in AssetType enum
})
type AccountProduct = z.infer<typeof AccountProduct>

const AccountCurrency = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.CURRENCY),
})
type AccountCurrency = z.infer<typeof AccountCurrency>

const AccountCollectiveInvestment = AccountsBaseInstrument.extend({
	assetType: z.literal(assetType.Enum.COLLECTIVE_INVESTMENT),
})
type AccountCollectiveInvestment = z.infer<typeof AccountCollectiveInvestment>

const AccountsInstrument = z.discriminatedUnion('assetType', [
	AccountCashEquivalent,
	AccountEquity,
	AccountFixedIncome,
	AccountMutualFund,
	AccountOption,
	AccountFuture,
	AccountForex,
	AccountIndex,
	AccountProduct,
	AccountCurrency,
	AccountCollectiveInvestment,
])
type AccountsInstrument = z.infer<typeof AccountsInstrument>

// --- Position Schema ---
const Position = z.object({
	shortQuantity: z.number().optional(),
	averagePrice: z.number().optional(),
	currentDayProfitLoss: z.number().optional(),
	currentDayProfitLossPercentage: z.number().optional(),
	longQuantity: z.number().optional(),
	settledLongQuantity: z.number().optional(),
	settledShortQuantity: z.number().optional(),
	agedQuantity: z.number().optional(),
	instrument: z.lazy(() => AccountsInstrument), // Defined above
	marketValue: z.number().optional(),
	maintenanceRequirement: z.number().optional(),
	averageLongPrice: z.number().optional(),
	averageShortPrice: z.number().optional(),
	taxLotAverageLongPrice: z.number().optional(),
	taxLotAverageShortPrice: z.number().optional(),
	longOpenProfitLoss: z.number().optional(),
	shortOpenProfitLoss: z.number().optional(),
	previousSessionLongQuantity: z.number().optional(),
	previousSessionShortQuantity: z.number().optional(),
	currentDayCost: z.number().optional(),
})
type Position = z.infer<typeof Position>

// --- Account Balance Schemas ---
const MarginInitialBalance = z.object({
	accruedInterest: z.number().optional(),
	availableFundsNonMarginableTrade: z.number().optional(),
	bondValue: z.number().optional(),
	buyingPower: z.number().optional(),
	cashBalance: z.number().optional(),
	cashAvailableForTrading: z.number().optional(),
	cashReceipts: z.number().optional(),
	dayTradingBuyingPower: z.number().optional(),
	dayTradingBuyingPowerCall: z.number().optional(),
	dayTradingEquityCall: z.number().optional(),
	equity: z.number().optional(),
	equityPercentage: z.number().optional(),
	liquidationValue: z.number().optional(),
	longMarginValue: z.number().optional(),
	longOptionMarketValue: z.number().optional(),
	longStockValue: z.number().optional(),
	maintenanceCall: z.number().optional(),
	maintenanceRequirement: z.number().optional(),
	margin: z.number().optional(),
	marginEquity: z.number().optional(),
	moneyMarketFund: z.number().optional(),
	mutualFundValue: z.number().optional(),
	regTCall: z.number().optional(),
	shortMarginValue: z.number().optional(),
	shortOptionMarketValue: z.number().optional(),
	shortStockValue: z.number().optional(),
	totalCash: z.number().optional(),
	isInCall: z.boolean().optional(),
	unsettledCash: z.number().optional(),
	pendingDeposits: z.number().optional(),
	marginBalance: z.number().optional(),
	shortBalance: z.number().optional(),
	accountValue: z.number().optional(),
})
type MarginInitialBalance = z.infer<typeof MarginInitialBalance>

const MarginBalance = z.object({
	availableFunds: z.number().optional(),
	availableFundsNonMarginableTrade: z.number().optional(),
	buyingPower: z.number().optional(),
	buyingPowerNonMarginableTrade: z.number().optional(),
	dayTradingBuyingPower: z.number().optional(),
	dayTradingBuyingPowerCall: z.number().optional(),
	equity: z.number().optional(),
	equityPercentage: z.number().optional(),
	longMarginValue: z.number().optional(),
	maintenanceCall: z.number().optional(),
	maintenanceRequirement: z.number().optional(),
	marginBalance: z.number().optional(),
	regTCall: z.number().optional(),
	shortBalance: z.number().optional(),
	shortMarginValue: z.number().optional(),
	sma: z.number().optional(),
	isInCall: z.boolean().optional(),
	stockBuyingPower: z.number().optional(),
	optionBuyingPower: z.number().optional(),
})
type MarginBalance = z.infer<typeof MarginBalance>

const CashInitialBalance = z.object({
	accruedInterest: z.number().optional(),
	cashAvailableForTrading: z.number().optional(),
	cashAvailableForWithdrawal: z.number().optional(),
	cashBalance: z.number().optional(),
	bondValue: z.number().optional(),
	cashReceipts: z.number().optional(),
	liquidationValue: z.number().optional(),
	longOptionMarketValue: z.number().optional(),
	longStockValue: z.number().optional(),
	moneyMarketFund: z.number().optional(),
	mutualFundValue: z.number().optional(),
	shortOptionMarketValue: z.number().optional(),
	shortStockValue: z.number().optional(),
	isInCall: z.boolean().optional(),
	unsettledCash: z.number().optional(),
	cashDebitCallValue: z.number().optional(),
	pendingDeposits: z.number().optional(),
	accountValue: z.number().optional(),
})
type CashInitialBalance = z.infer<typeof CashInitialBalance>

const CashBalance = z.object({
	cashAvailableForTrading: z.number().optional(),
	cashAvailableForWithdrawal: z.number().optional(),
	cashCall: z.number().optional(),
	longNonMarginableMarketValue: z.number().optional(),
	totalCash: z.number().optional(),
	cashDebitCallValue: z.number().optional(),
	unsettledCash: z.number().optional(),
	accruedInterest: z.number().optional(),
	cashBalance: z.number().optional(),
	cashReceipts: z.number().optional(),
	longOptionMarketValue: z.number().optional(),
	liquidationValue: z.number().optional(),
	longMarketValue: z.number().optional(),
	moneyMarketFund: z.number().optional(),
	savings: z.number().optional(),
	shortMarketValue: z.number().optional(),
	pendingDeposits: z.number().optional(),
	mutualFundValue: z.number().optional(),
	bondValue: z.number().optional(),
	shortOptionMarketValue: z.number().optional(),
})
type CashBalance = z.infer<typeof CashBalance>

// --- Account Core Schemas ---
const SecuritiesAccountBase = z.object({
	type: z.string(), // Will be 'MARGIN' or 'CASH' in extending types
	accountNumber: z.string(),
	roundTrips: z.number().int().optional(),
	isDayTrader: z.boolean().default(false).optional(),
	isClosingOnlyRestricted: z.boolean().default(false).optional(),
	pfcbFlag: z.boolean().default(false).optional(),
	positions: z.array(Position).default([]).optional(),
})
type SecuritiesAccountBase = z.infer<typeof SecuritiesAccountBase>

const MarginAccount = SecuritiesAccountBase.extend({
	type: z.literal('MARGIN'),
	initialBalances: MarginInitialBalance.optional(),
	currentBalances: MarginBalance.optional(),
	projectedBalances: MarginBalance.optional(), // MCP used MarginBalance here
})
type MarginAccount = z.infer<typeof MarginAccount>

const CashAccount = SecuritiesAccountBase.extend({
	type: z.literal('CASH'),
	initialBalances: CashInitialBalance.optional(),
	currentBalances: CashBalance.optional(),
	projectedBalances: z
		.object({
			// MCP had a specific structure here
			cashAvailableForTrading: z.number().optional(),
			cashAvailableForWithdrawal: z.number().optional(),
		})
		.optional(),
})
type CashAccount = z.infer<typeof CashAccount>

const SecuritiesAccount = z.discriminatedUnion('type', [
	MarginAccount,
	CashAccount,
])
type SecuritiesAccount = z.infer<typeof SecuritiesAccount>

// --- GET /accounts endpoint schemas ---

// Path Parameters Schema for GET /accounts (no path params)
export const GetAccountsPathParams = z.object({})
export type GetAccountsPathParams = z.infer<typeof GetAccountsPathParams>

// Query Parameters Schema for GET /accounts
export const GetAccountsQueryParams = z.object({
	fields: z
		.string()
		.optional()
		.describe(
			'A comma-separated string of fields to return for each account. Valid values include: positions',
		),
})
export type GetAccountsQueryParams = z.infer<typeof GetAccountsQueryParams>

// Request Params Schema for GET /accounts (merged path + query params)
export const GetAccountsParams = z.object(
	mergeShapes(GetAccountsQueryParams.shape, GetAccountsPathParams.shape),
)
export type GetAccountsParams = z.infer<typeof GetAccountsParams>

// Response Body Schema for GET /accounts
export const GetAccountsResponse = z.array(
	z.object({
		securitiesAccount: SecuritiesAccount,
	}),
)
export type GetAccountsResponse = z.infer<typeof GetAccountsResponse>

// --- GET /accounts/{accountNumber} endpoint schemas ---

// Path Parameters Schema for GET /accounts/{accountNumber}
export const GetAccountByNumberPathParams = z.object({
	accountNumber: z.string().describe('Encrypted account number'),
})
export type GetAccountByNumberPathParams = z.infer<
	typeof GetAccountByNumberPathParams
>

// Query Parameters Schema for GET /accounts/{accountNumber}
export const GetAccountByNumberQueryParams = z.object({
	fields: z
		.string()
		.optional()
		.describe(
			'A comma-separated string of fields to return. Valid values include: positions',
		),
})
export type GetAccountByNumberQueryParams = z.infer<
	typeof GetAccountByNumberQueryParams
>

// Request Params Schema for GET /accounts/{accountNumber} (merged path + query params)
export const GetAccountByNumberParams = z.object(
	mergeShapes(
		GetAccountByNumberQueryParams.shape,
		GetAccountByNumberPathParams.shape,
	),
)
export type GetAccountByNumberParams = z.infer<typeof GetAccountByNumberParams>

// Response Body Schema for GET /accounts/{accountNumber}
export const GetAccountByNumberResponse = z.object({
	securitiesAccount: SecuritiesAccount,
})
export type GetAccountByNumberResponse = z.infer<
	typeof GetAccountByNumberResponse
>

// --- GET /accountNumbers endpoint schemas ---

// Path Parameters Schema for GET /accountNumbers (no path params)
export const GetAccountNumbersPathParams = z.object({})
export type GetAccountNumbersPathParams = z.infer<
	typeof GetAccountNumbersPathParams
>

// Query Parameters Schema for GET /accountNumbers (no query params)
export const GetAccountNumbersQueryParams = z.object({})
export type GetAccountNumbersQueryParams = z.infer<
	typeof GetAccountNumbersQueryParams
>

// Request Params Schema for GET /accountNumbers (merged path + query params)
export const GetAccountNumbersParams = z.object(
	mergeShapes(
		GetAccountNumbersQueryParams.shape,
		GetAccountNumbersPathParams.shape,
	),
)
export type GetAccountNumbersParams = z.infer<typeof GetAccountNumbersParams>

// Response Body Schema for GET /accountNumbers
export const GetAccountNumbersResponse = z.array(
	z.object({
		accountNumber: z.string().describe('Encrypted account number'),
		hashValue: z.string().describe('Hash value for the account'),
	}),
)
export type GetAccountNumbersResponse = z.infer<
	typeof GetAccountNumbersResponse
>
