import { z } from 'zod'

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
	deliverableUnits: z.string().describe('Units of the deliverable'), // Screenshot indicates string, e.g. "100.0"
	currencyType: z.string().describe('Currency type of the deliverable'),
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
		.describe('Trade date of the option (numeric, possibly a timestamp or 0 if not set/applicable).'),
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

// Maps strike price (string) to OptionContract
export const OptionContractMapSchema = z.record(
	z.string(),
	OptionContractSchema,
)
export type OptionContractMapSchema = z.infer<typeof OptionContractMapSchema>

// Maps expiration date (string) to a map of strike prices to OptionContracts
export const OptionContractDateMapSchema = z.record(
	z.string(),
	OptionContractMapSchema,
)
export type OptionContractDateMapSchema = z.infer<
	typeof OptionContractDateMapSchema
>

// --- Main OptionChain Schema ---

export const OptionChainSchema = z.object({
	symbol: z.string().describe('Symbol for which the option chain is requested'),
	status: z.string().describe('Status of the request (e.g., SUCCESS)'),
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
	callExpDateMap: OptionContractDateMapSchema.describe(
		'Map of expiration dates to call option contracts',
	),
	putExpDateMap: OptionContractDateMapSchema.describe(
		'Map of expiration dates to put option contracts',
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

// Schema for Request Query Parameters of GET /chains
export const GetOptionChainRequestQueryParamsSchema = z.object({
	symbol: z.string().describe('Symbol for the option chain'),
	contractType: OptionContractTypeQueryEnum.optional().describe(
		'Type of contracts to return (CALL, PUT, ALL)',
	),
	strikeCount: z
		.number()
		.int()
		.optional()
		.describe(
			'The number of strikes to return above and below the at-the-money price',
		),
	includeUnderlyingQuote: z
		.boolean()
		.optional()
		.describe('Include underlying quote in the response'),
	strategy: OptionStrategyEnum.optional().describe(
		'Option chain strategy. Default is SINGLE.',
	),
	interval: z
		.number()
		.optional()
		.describe('Strike interval for spread strategy chains'),
	strike: z.number().optional().describe('Specific strike price to return'),
	range: OptionRangeQueryEnum.optional().describe(
		'Range of strikes to return (ITM, NTM, OTM, etc.)',
	),
	fromDate: z
		.string()
		// .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format') // Consider adding if API enforces strict format
		.optional()
		.describe('Start date for expiration (YYYY-MM-DD)'),
	toDate: z
		.string()
		// .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
		.optional()
		.describe('End date for expiration (YYYY-MM-DD)'),
	volatility: z
		.number()
		.optional()
		.describe('Volatility to use in calculations (ANALYTICAL strategy only)'),
	underlyingPrice: z
		.number()
		.optional()
		.describe(
			'Underlying price to use in calculations (ANALYTICAL strategy only)',
		),
	interestRate: z
		.number()
		.optional()
		.describe(
			'Interest rate to use in calculations (ANALYTICAL strategy only)',
		),
	daysToExpiration: z
		.number()
		.int()
		.optional()
		.describe(
			'Days to expiration to use in calculations (ANALYTICAL strategy only)',
		),
	expMonth: OptionExpMonthQueryEnum.optional().describe(
		'Month of expiration to return (JAN, FEB, ..., ALL)',
	),
	optionType: OptionTypeQueryEnum.optional().describe(
		'Type of options to return (S, NS, ALL)',
	),
	entitlement: OptionEntitlementQueryEnum.optional().describe(
		'Client entitlement (PN, NP, PP)',
	),
})
export type GetOptionChainRequestQueryParamsSchema = z.infer<
	typeof GetOptionChainRequestQueryParamsSchema
>

// --- Schemas for GET /expirationchain endpoint ---

// Schema for Request Query Parameters of GET /expirationchain
export const GetOptionExpirationChainRequestQueryParamsSchema = z.object({
	symbol: z.string().describe('Symbol for the option expiration chain'),
})
export type GetOptionExpirationChainRequestQueryParamsSchema = z.infer<
	typeof GetOptionExpirationChainRequestQueryParamsSchema
>

// Schema for an item in the expirationList
export const ExpirationItemSchema = z.object({
	daysToExpiration: z
		.number()
		.int()
		.optional()
		.describe('Number of days until expiration'),
	expirationDate: z
		.string()
		.describe('Expiration date (e.g., YYYY-MM-DD format)'),
	expirationType: ExpirationTypeEnum.describe('Type of expiration cycle'), // Reusing existing enum
	standard: z
		.boolean()
		.optional()
		.describe('Indicates if the expiration is standard'),
	settlementType: SettlementTypeEnum.describe(
		'Option contract settlement type (AM or PM)',
	), // Reusing existing enum
	optionRoots: z
		.string()
		.optional()
		.describe('Comma-separated list of option root symbols or a single root'),
})
export type ExpirationItemSchema = z.infer<typeof ExpirationItemSchema>

// Schema for Response Body of GET /expirationchain
export const OptionExpirationChainResponseBodySchema = z.object({
	status: z.string().optional().describe('Status of the request'),
	expirationList: z
		.array(ExpirationItemSchema)
		.describe('List of option expiration series'),
})
export type OptionExpirationChainResponseBodySchema = z.infer<
	typeof OptionExpirationChainResponseBodySchema
>
