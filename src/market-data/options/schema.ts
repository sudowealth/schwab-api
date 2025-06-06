import { z } from 'zod'
import { mergeShapes } from '../../utils/schema-utils'

// --- Enums ---

export const UnderlyingExchangeEnum = z.enum([
	'IND',
	'ASE',
	'NYS',
	'NAS',
	'NAP',
	'PAC',
	'OPR',
	'BATS',
])
export type UnderlyingExchangeEnum = z.infer<typeof UnderlyingExchangeEnum>

export const OptionStrategyEnum = z.enum([
	'SINGLE',
	'ANALYTICAL',
	'COVERED',
	'VERTICAL',
	'CALENDAR',
	'STRANGLE',
	'STRADDLE',
	'BUTTERFLY',
	'CONDOR',
	'DIAGONAL',
	'COLLAR',
	'ROLL',
])
export type OptionStrategyEnum = z.infer<typeof OptionStrategyEnum>

export const PutCallEnum = z.enum(['PUT', 'CALL'])
export type PutCallEnum = z.infer<typeof PutCallEnum>

export const ExpirationTypeEnum = z.enum(['M', 'Q', 'S', 'W'])
export type ExpirationTypeEnum = z.infer<typeof ExpirationTypeEnum>

export const SettlementTypeEnum = z.enum(['A', 'P']) // AM or PM
export type SettlementTypeEnum = z.infer<typeof SettlementTypeEnum>

// --- Nested Schemas ---

export const OptionDeliverablesSchema = z.object({
	symbol: z.string().describe('Deliverable symbol'),
	assetType: z
		.string()
		.describe('Asset type of the deliverable (e.g., EQUITY, CURRENCY)'), // Consider reusing InstrumentAssetTypeEnum if applicable
	deliverableUnits: z
		.union([z.string(), z.number()])
		.describe('Units of the deliverable'),
	currencyType: z
		.string()
		.optional()
		.describe('Currency type of the deliverable'),
})
export type OptionDeliverablesSchema = z.infer<typeof OptionDeliverablesSchema>

export const UnderlyingSchema = z.object({
	ask: z.number().optional().describe('Current ask price for the underlying'),
	askSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares for ask for the underlying'),
	bid: z.number().optional().describe('Current bid price for the underlying'),
	bidSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares for bid for the underlying'),
	change: z
		.number()
		.optional()
		.describe('Current day change for the underlying'),
	close: z
		.number()
		.optional()
		.describe("Previous day's closing price for the underlying"),
	delayed: z
		.boolean()
		.optional()
		.describe('Is the quote delayed for the underlying'),
	description: z.string().optional().describe('Description of the underlying'),
	exchangeName: UnderlyingExchangeEnum.optional().describe(
		'Exchange of the underlying',
	),
	fiftyTwoWeekHigh: z
		.number()
		.optional()
		.describe('52-week high price for the underlying'),
	fiftyTwoWeekLow: z
		.number()
		.optional()
		.describe('52-week low price for the underlying'),
	highPrice: z
		.number()
		.optional()
		.describe("Current day's high price for the underlying"),
	last: z.number().optional().describe('Last trade price for the underlying'),
	lowPrice: z
		.number()
		.optional()
		.describe("Current day's low price for the underlying"),
	mark: z.number().optional().describe('Mark price for the underlying'),
	markChange: z.number().optional().describe('Mark change for the underlying'),
	markPercentChange: z
		.number()
		.optional()
		.describe('Mark percent change for the underlying'),
	openPrice: z
		.number()
		.optional()
		.describe("Current day's opening price for the underlying"),
	percentChange: z
		.number()
		.optional()
		.describe('Percent change for the underlying'),
	quoteTime: z
		.number()
		.int()
		.optional()
		.describe('Quote time in milliseconds since Epoch for the underlying'), // int64 in image
	symbol: z.string().optional().describe('Symbol of the underlying'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe('Total volume for the underlying'), // int64 in image
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch for the underlying'), // int64 in image
})
export type UnderlyingSchema = z.infer<typeof UnderlyingSchema>

export const OptionContractSchema = z.object({
	putCall: PutCallEnum.describe('Indicates if the option is a PUT or CALL'),
	symbol: z.string().describe('Option symbol'),
	description: z
		.string()
		.optional()
		.describe('Description of the option contract'),
	exchangeName: z.string().optional().describe('Exchange name for the option'),
	bidPrice: z.number().optional().describe('Current bid price for the option'),
	askPrice: z.number().optional().describe('Current ask price for the option'),
	lastPrice: z.number().optional().describe('Last trade price for the option'),
	markPrice: z.number().optional().describe('Mark price for the option'),
	bidSize: z.number().int().optional().describe('Number of contracts for bid'),
	askSize: z.number().int().optional().describe('Number of contracts for ask'),
	lastSize: z
		.number()
		.int()
		.optional()
		.describe('Number of contracts in last trade'),
	highPrice: z.number().optional().describe("Day's high price for the option"),
	lowPrice: z.number().optional().describe("Day's low price for the option"),
	openPrice: z
		.number()
		.optional()
		.describe("Day's opening price for the option"),
	closePrice: z
		.number()
		.optional()
		.describe("Previous day's closing price for the option"),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe('Total volume for the option'),
	tradeDate: z
		.number()
		.int()
		.optional()
		.describe(
			'Trade date of the option (numeric, possibly a timestamp or 0 if not set/applicable).',
		),
	quoteTimeInLong: z
		.number()
		.int()
		.optional()
		.describe('Quote time in milliseconds since Epoch'),
	tradeTimeInLong: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
	netChange: z.number().optional().describe('Net change for the option'),
	volatility: z
		.number()
		.optional()
		.describe('Implied volatility for the option'),
	delta: z.number().optional().describe('Delta value of the option'),
	gamma: z.number().optional().describe('Gamma value of the option'),
	theta: z.number().optional().describe('Theta value of the option'),
	vega: z.number().optional().describe('Vega value of the option'),
	rho: z.number().optional().describe('Rho value of the option'),
	timeValue: z.number().optional().describe('Time value of the option'),
	openInterest: z
		.number()
		.int()
		.optional()
		.describe('Open interest for the option'),
	isInTheMoney: z.boolean().optional().describe('Is the option in the money'),
	theoreticalOptionValue: z
		.number()
		.optional()
		.describe('Theoretical value of the option'),
	theoreticalVolatility: z
		.number()
		.optional()
		.describe('Theoretical volatility of the option'),
	isMini: z.boolean().optional().describe('Is it a mini option'),
	isNonStandard: z.boolean().optional().describe('Is it a non-standard option'),
	optionDeliverablesList: z
		.array(OptionDeliverablesSchema)
		.optional()
		.describe('List of deliverables for the option'),
	strikePrice: z.number().describe('Strike price of the option'),
	expirationDate: z
		.string()
		.describe('Expiration date of the option (e.g. YYYY-MM-DDTHH:mm:ssZ)'),
	daysToExpiration: z
		.number()
		.int()
		.optional()
		.describe('Number of days to expiration'),
	expirationType: ExpirationTypeEnum.optional().describe(
		'Type of expiration (Monthly, Weekly, etc.)',
	),
	lastTradingDay: z
		.number()
		.int()
		.optional()
		.describe('Last trading day in milliseconds since Epoch'), // long in image
	multiplier: z.number().optional().describe('Option contract multiplier'),
	settlementType: SettlementTypeEnum.optional().describe(
		'Settlement type (AM or PM)',
	),
	deliverableNote: z.string().optional().describe('Note about deliverables'),
	isIndexOption: z.boolean().optional().describe('Is it an index option'),
	percentChange: z
		.number()
		.optional()
		.describe('Percent change for the option'),
	markChange: z.number().optional().describe('Mark change for the option'),
	markPercentChange: z
		.number()
		.optional()
		.describe('Mark percent change for the option'),
	isPennyPilot: z
		.boolean()
		.optional()
		.describe('Is the option part of the penny pilot program'),
	intrinsicValue: z
		.number()
		.optional()
		.describe('Intrinsic value of the option'),
	optionRoot: z.string().optional().describe('Option root symbol'),
})
export type OptionContractSchema = z.infer<typeof OptionContractSchema>

// Maps strike price (string) to array of OptionContract
export const OptionContractMapSchema = z.record(
	z.string(),
	z.array(OptionContractSchema),
)
export type OptionContractMapSchema = z.infer<typeof OptionContractMapSchema>

// Maps expiration date (string) to a map of strike prices to arrays of OptionContracts
export const OptionContractDateMapSchema = z.record(
	z.string(),
	OptionContractMapSchema,
)
export type OptionContractDateMapSchema = z.infer<
	typeof OptionContractDateMapSchema
>

// --- Main OptionChain Schema ---

export const OptionChainSchema = z.object({
	symbol: z
		.string()
		.optional()
		.describe('Symbol for which the option chain is requested'),
	status: z
		.string()
		.optional()
		.describe('Status of the request (e.g., SUCCESS)'),
	underlying: UnderlyingSchema.optional().describe(
		'Details of the underlying instrument',
	),
	strategy: OptionStrategyEnum.optional().describe(
		'Strategy used for the option chain request',
	),
	interval: z
		.number()
		.optional()
		.describe('Interval for the strategy if applicable'),
	isDelayed: z
		.boolean()
		.optional()
		.describe('Indicates if the data is delayed'),
	isIndex: z
		.boolean()
		.optional()
		.describe('Indicates if the underlying is an index'),
	daysToExpiration: z
		.number()
		.optional()
		.describe(
			'Days to expiration (might be specific to a leg if strategy is complex)',
		),
	interestRate: z.number().optional().describe('Current interest rate'),
	underlyingPrice: z
		.number()
		.optional()
		.describe('Price of the underlying security at the time of the request'),
	volatility: z.number().optional().describe('Volatility of the underlying'),
	callExpDateMap: OptionContractDateMapSchema.optional().describe(
		'Map of expiration dates to call option contracts. May be omitted if no call options exist for the query.',
	),
	putExpDateMap: OptionContractDateMapSchema.optional().describe(
		'Map of expiration dates to put option contracts. May be omitted if no put options exist for the query.',
	),
})
export type OptionChainSchema = z.infer<typeof OptionChainSchema>

// --- Schemas for GET /chains endpoint ---

// Enums for Query Parameters
export const OptionContractTypeQueryEnum = z.enum(['CALL', 'PUT', 'ALL'])
export type OptionContractTypeQueryEnum = z.infer<
	typeof OptionContractTypeQueryEnum
>

export const OptionRangeQueryEnum = z.enum([
	'ITM', // In-the-money
	'NTM', // Near-the-money
	'OTM', // Out-of-the-money
	'SAK', // Strikes Above Market
	'SBK', // Strikes Below Market
	'SNK', // Strikes Near Market
	'ALL', // All Strikes
])
export type OptionRangeQueryEnum = z.infer<typeof OptionRangeQueryEnum>

export const OptionExpMonthQueryEnum = z.enum([
	'JAN',
	'FEB',
	'MAR',
	'APR',
	'MAY',
	'JUN',
	'JUL',
	'AUG',
	'SEP',
	'OCT',
	'NOV',
	'DEC',
	'ALL',
])
export type OptionExpMonthQueryEnum = z.infer<typeof OptionExpMonthQueryEnum>

export const OptionTypeQueryEnum = z.enum(['S', 'NS', 'ALL']) // Standard, Non-Standard, All
export type OptionTypeQueryEnum = z.infer<typeof OptionTypeQueryEnum>

export const OptionEntitlementQueryEnum = z.enum(['PN', 'NP', 'PP']) // PP-PayingPro, NP-NonPro, PN-NonPayingPro
export type OptionEntitlementQueryEnum = z.infer<
	typeof OptionEntitlementQueryEnum
>

// Path Parameters Schema for GET /chains (no path params)
export const GetOptionChainPathParams = z.object({})
export type GetOptionChainPathParams = z.infer<typeof GetOptionChainPathParams>

// Query Parameters Schema for GET /chains
export const GetOptionChainQueryParams = z.object({
	symbol: z.string().describe('Symbol for the option chain'),
	contractType: OptionContractTypeQueryEnum.optional().describe(
		'Type of contracts to retrieve. Available values: CALL, PUT, ALL',
	),
	strikeCount: z
		.number()
		.int()
		.optional()
		.describe(
			'Number of strikes to return above and below the at-the-money price',
		),
	includeUnderlyingQuote: z
		.boolean()
		.optional()
		.describe('Include quote for the underlying asset'),
	strategy: OptionStrategyEnum.optional().describe(
		'Option strategy. Available values: SINGLE, ANALYTICAL, COVERED, VERTICAL, CALENDAR, STRANGLE, STRADDLE, BUTTERFLY, CONDOR, DIAGONAL, COLLAR, ROLL',
	),
	interval: z
		.number()
		.optional()
		.describe('Strike interval for spread strategies'),
	strike: z.number().optional().describe('Specific strike price'),
	range: OptionRangeQueryEnum.optional().describe(
		'Range of option strikes. Available values: ITM, NTM, OTM, SAK, SBK, SNK, ALL',
	),
	fromDate: z
		.string()
		.optional()
		.describe(
			'Only return options with expiration dates on or after this date',
		),
	toDate: z
		.string()
		.optional()
		.describe(
			'Only return options with expiration dates on or before this date',
		),
	volatility: z
		.number()
		.optional()
		.describe('Volatility to use in calculations'),
	underlyingPrice: z
		.number()
		.optional()
		.describe('Underlying price to use in calculations'),
	interestRate: z
		.number()
		.optional()
		.describe('Interest rate to use in calculations'),
	daysToExpiration: z
		.number()
		.int()
		.optional()
		.describe('Days to expiration to use in calculations'),
	expMonth: OptionExpMonthQueryEnum.optional().describe(
		'Return only options expiring in the specified month. Available values: ALL, JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC',
	),
	optionType: OptionTypeQueryEnum.optional().describe(
		'Type of options to retrieve. Available values: S, NS, ALL',
	),
	entitlement: OptionEntitlementQueryEnum.optional().describe(
		'Account entitlement for option data. Available values: PN, NP, PP',
	),
})
export type GetOptionChainQueryParams = z.infer<
	typeof GetOptionChainQueryParams
>

// Request Params Schema for GET /chains (merged path + query params)
export const GetOptionChainParams = z.object(
	mergeShapes(GetOptionChainQueryParams.shape, GetOptionChainPathParams.shape),
)
export type GetOptionChainParams = z.infer<typeof GetOptionChainParams>

// Response Body Schema for GET /chains
export const GetOptionChainResponse = OptionChainSchema
export type GetOptionChainResponse = z.infer<typeof GetOptionChainResponse>

// --- Schemas for GET /expirationchain endpoint ---

// Schema for individual expiration items in the expiration chain
export const OptionExpirationItemSchema = z.object({
	expirationDate: z
		.string()
		.describe('Expiration date in YYYY-MM-DD format (e.g., "2025-06-06")'),
	daysToExpiration: z
		.number()
		.int()
		.describe('Number of days until expiration'),
	expirationType: z
		.string()
		.describe('Type of expiration (e.g., "W" for weekly, "S" for standard)'),
	settlementType: z
		.string()
		.describe('Settlement type (e.g., "P" for PM settlement)'),
	optionRoots: z
		.string()
		.describe('Option root symbol (typically same as underlying symbol)'),
	standard: z.boolean().describe('Whether this is a standard expiration'),
})
export type OptionExpirationItemSchema = z.infer<
	typeof OptionExpirationItemSchema
>

// Schema for the complete expiration chain response
export const OptionExpirationChainSchema = z.object({
	expirationList: z
		.array(OptionExpirationItemSchema)
		.describe('List of available expiration dates and their details'),
})
export type OptionExpirationChainSchema = z.infer<
	typeof OptionExpirationChainSchema
>

// Path Parameters Schema for GET /expirationchain (no path params)
export const GetOptionExpirationChainPathParams = z.object({})
export type GetOptionExpirationChainPathParams = z.infer<
	typeof GetOptionExpirationChainPathParams
>

// Query Parameters Schema for GET /expirationchain
export const GetOptionExpirationChainQueryParams = z.object({
	symbol: z.string().describe('Symbol for the option expiration chain'),
})
export type GetOptionExpirationChainQueryParams = z.infer<
	typeof GetOptionExpirationChainQueryParams
>

// Request Params Schema for GET /expirationchain (merged path + query params)
export const GetOptionExpirationChainParams = z.object(
	mergeShapes(
		GetOptionExpirationChainQueryParams.shape,
		GetOptionExpirationChainPathParams.shape,
	),
)
export type GetOptionExpirationChainParams = z.infer<
	typeof GetOptionExpirationChainParams
>

// Response Body Schema for GET /expirationchain
export const GetOptionExpirationChainResponse = OptionExpirationChainSchema
export type GetOptionExpirationChainResponse = z.infer<
	typeof GetOptionExpirationChainResponse
>
