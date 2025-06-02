import { z } from 'zod'
import { epochMillisSchema, isoDateTimeSchema } from '../../utils/date-utils'
import { mergeShapes } from '../../utils/schema-utils'
import { InstrumentAssetTypeEnum } from '../shared'

// Enum for the 'fields' query parameter
export const QuoteFieldsEnum = z.enum([
	'quote',
	'fundamental',
	'extended',
	'reference',
	'regular',
	'all',
])
export type QuoteFieldsEnum = z.infer<typeof QuoteFieldsEnum>

// Enum for assetMainType
export const QuotesAssetMainTypeEnum = z.enum([
	'EQUITY',
	'ETF',
	'OPTION',
	'MUTUAL_FUND',
	'BOND',
	'INDEX',
	'FUTURE_OPTION',
	'FUTURE',
	'FOREX',
	// Add others if known from a more complete list
])
export type QuotesAssetMainTypeEnum = z.infer<typeof QuotesAssetMainTypeEnum>

// Enum for assetSubType - this is a very long list, partial for brevity here, expand as needed
export const QuotesAssetSubTypeEnum = z.enum([
	'COMMON_STOCK',
	'PREFERRED_STOCK',
	'WARRANT',
	'ADR',
	'ETF_STOCK',
	'ETF_BOND',
	'ETF',
	'COE',
	'INDEX_OPTION',
	'EQUITY_OPTION',
	// Removed placeholder comment string from enum values
])
export type QuotesAssetSubTypeEnum = z.infer<typeof QuotesAssetSubTypeEnum>

// Enum for assetSubType for Mutual Funds
export const MutualFundAssetSubTypeEnum = z.enum([
	'OEF', // Open-End Fund
	'CEF', // Closed-End Fund
	'MMF', // Money Market Fund
	// Add others if identified
])
export type MutualFundAssetSubTypeEnum = z.infer<
	typeof MutualFundAssetSubTypeEnum
>

// Schema for the "Quote" data block
export const QuoteBlockSchema = z.object({
	'52WeekHigh': z.number().optional().describe('52 week high price'),
	'52WeekLow': z.number().optional().describe('52 week low price'),
	askMICId: z.string().optional().describe('Ask Market Identifier Code'),
	askPrice: z.number().optional().describe('Current Ask Price'),
	askSize: z.number().int().optional().describe('Number of shares for ask'),
	askTime: epochMillisSchema
		.optional()
		.describe('Last ask time in milliseconds since Epoch'),
	bidMICId: z.string().optional().describe('Bid Market Identifier Code'),
	bidPrice: z.number().optional().describe('Current Bid Price'),
	bidSize: z.number().int().optional().describe('Number of shares for bid'),
	bidTime: epochMillisSchema
		.optional()
		.describe('Last bid time in milliseconds since Epoch'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	highPrice: z.number().optional().describe("Day's high trade price"),
	lastMICId: z.string().optional().describe('Last Market Identifier Code'),
	lastPrice: z.number().optional().describe('Price of the last trade'),
	lastSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares traded with last trade'),
	lowPrice: z.number().optional().describe("Day's low trade price"),
	mark: z.number().optional().describe('Mark price'),
	markChange: z.number().optional().describe('Mark price change'),
	markPercentChange: z
		.number()
		.optional()
		.describe('Mark price percent change'),
	netChange: z.number().optional().describe('Net price change'),
	netPercentChange: z.number().optional().describe('Net price percent change'),
	openPrice: z.number().optional().describe("Day's opening price"),
	postMarketChange: z.number().optional().describe('Post-market change'),
	postMarketPercentChange: z
		.number()
		.optional()
		.describe('Post-market percent change'),
	quoteTime: epochMillisSchema
		.optional()
		.describe('Last quote time in milliseconds since Epoch'),
	securityStatus: z
		.string()
		.optional()
		.describe('Status of security (e.g., Halted)'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe('Aggregated shares traded throughout the day'),
	tradeTime: epochMillisSchema
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
	volatility: z
		.number()
		.optional()
		.describe('Option Risk/Volatility Measurement'),
})
export type QuoteBlockSchema = z.infer<typeof QuoteBlockSchema>

// Schema for the "Fundamental" data block (Quotes specific)
export const QuotesFundamentalBlockSchema = z.object({
	avg10DaysVolume: z.number().optional().describe('Average 10 day volume'),
	avg1DayVolume: z.number().optional().describe('Average 1 day volume'),
	declarationDate: isoDateTimeSchema.optional().describe('Declaration date'),
	divAmount: z.number().optional().describe('Dividend Amount'),
	divExDate: isoDateTimeSchema.optional().describe('Dividend Ex-Date'),
	divFreq: z
		.number()
		.int()
		.optional()
		.describe(
			'Dividend Frequency (e.g., 1=annual, 2=semi-annual, 4=quarterly, 12=monthly)',
		),
	dividendPayAmount: z.number().optional().describe('Dividend Pay Amount'),
	dividendPayDate: isoDateTimeSchema.optional().describe('Dividend Pay Date'),
	divYield: z.number().optional().describe('Dividend Yield'),
	eps: z.number().optional().describe('Earnings Per Share'),
	fundLeverageFactor: z
		.number()
		.optional()
		.describe('Fund Leverage Factor e.g. 2x'),
	fundStrategy: z.string().optional().describe('Fund Strategy'),
	high52: z
		.number()
		.optional()
		.describe('Highest price traded in the past 12 months'),
	lastEarningsDate: isoDateTimeSchema.optional().describe('Last earnings date'),
	low52: z
		.number()
		.optional()
		.describe('Lowest price traded in the past 12 months'),
	marketCap: z.number().optional().describe('Market Capitalization'),
	nextDivExDate: isoDateTimeSchema.optional().describe('Next Dividend Ex-Date'),
	nextDivPayDate: isoDateTimeSchema
		.optional()
		.describe('Next Dividend Pay Date'),
	pbRatio: z.number().optional().describe('Price to Book Ratio'),
	peRatio: z.number().optional().describe('Price to Earnings Ratio'),
	pegRatio: z.number().optional().describe('Price to Earnings Growth Ratio'),
	prRatio: z.number().optional().describe('Price to Revenue Ratio'),
	qualifier: z.string().optional().describe('Qualifier code'),
	volatility: z.number().optional().describe('Volatility measurement'),
	week52HighDate: isoDateTimeSchema.optional().describe('Date of 52 week high'),
	week52LowDate: isoDateTimeSchema.optional().describe('Date of 52 week low'),
})
export type QuotesFundamentalBlockSchema = z.infer<
	typeof QuotesFundamentalBlockSchema
>

// Schema for the "ExtendedMarket" data block
export const QuotesExtendedMarketBlockSchema = z.object({
	askPrice: z.number().optional().describe('Extended market ask price'),
	askSize: z.number().int().optional().describe('Extended market ask size'),
	bidPrice: z.number().optional().describe('Extended market bid price'),
	bidSize: z.number().int().optional().describe('Extended market bid size'),
	lastPrice: z.number().optional().describe('Extended market last price'),
	lastSize: z.number().int().optional().describe('Extended market last size'),
	mark: z.number().optional().describe('Extended market mark price'),
	markChange: z.number().optional().describe('Extended market mark change'),
	markPercentChange: z
		.number()
		.optional()
		.describe('Extended market mark percent change'),
	quoteTime: epochMillisSchema
		.optional()
		.describe('Extended market quote time in milliseconds since Epoch'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe('Extended market total volume'),
	tradeTime: epochMillisSchema
		.optional()
		.describe('Extended market trade time in milliseconds since Epoch'),
})
export type QuotesExtendedMarketBlockSchema = z.infer<
	typeof QuotesExtendedMarketBlockSchema
>

// Schema for the "RegularMarket" data block
export const QuotesRegularMarketBlockSchema = z.object({
	lastPrice: z.number().optional().describe('Regular market last price'),
	lastSize: z.number().int().optional().describe('Regular market last size'),
	netChange: z.number().optional().describe('Regular market net change'),
	netPercentChange: z
		.number()
		.optional()
		.describe('Regular market percent change'),
	tradeTime: epochMillisSchema
		.optional()
		.describe('Regular market trade time in milliseconds since Epoch'),
})
export type QuotesRegularMarketBlockSchema = z.infer<
	typeof QuotesRegularMarketBlockSchema
>

// Schema for the "Reference" data block
export const QuotesReferenceBlockSchema = z.object({
	cusip: z.string().optional().describe('CUSIP of instrument'),
	description: z.string().optional().describe('Description of instrument'),
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
	isHardToBorrow: z.boolean().optional().describe('Is hard to borrow security'),
	isShortable: z.boolean().optional().describe('Is shortable security'),
	marketMaker: z.string().optional().describe('Market Maker'),
	symbol: z.string().optional().describe('Symbol of instrument'),
	type: z.string().optional().describe('Type (e.g., COMMON_STOCK)'),
})
export type QuotesReferenceBlockSchema = z.infer<
	typeof QuotesReferenceBlockSchema
>

// --- Asset-Specific Response Schemas ---
// NOTE: The individual asset response schemas below are deprecated in favor of the
// unified QuoteResponseSchema which can handle all asset types without discrimination.
// These are kept for backward compatibility but QuoteResponseSchema should be used instead.

// Base for common fields across different quote responses
const BaseQuoteAssetResponseSchema = z.object({
	assetType: InstrumentAssetTypeEnum.optional().describe(
		"Instrument's asset type",
	),
	assetMainType: QuotesAssetMainTypeEnum.optional().describe(
		"Instrument's main asset type",
	),
	assetSubType: QuotesAssetSubTypeEnum.optional().describe(
		"Instrument's sub asset type",
	),
	cusip: z.string().optional().describe('CUSIP identifier'),
	description: z.string().optional().describe('Description of the security'), // Can also be in Reference block
	isDelayed: z
		.boolean()
		.optional()
		.describe('Indicates if the quote is delayed'),
	mark: z.number().optional().describe('Current mark price'),
	markChangeInDouble: z.number().optional().describe('Mark change value'),
	markPercentChangeInDouble: z
		.number()
		.optional()
		.describe('Mark percent change value'),
	netChangeInDouble: z.number().optional().describe('Net change value'),
	netPercentChangeInDouble: z
		.number()
		.optional()
		.describe('Net percent change value'),
	postMarketChangeInDouble: z
		.number()
		.optional()
		.describe('Post market change value'),
	postMarketPercentChangeInDouble: z
		.number()
		.optional()
		.describe('Post market percent change value'),
	quoteType: z
		.string()
		.optional()
		.describe('Type of quote (e.g., NBBO, DELAYED)'),
	realtime: z.boolean().optional().describe('Is quote realtime'),
	securityStatus: z.string().optional().describe('Security trading status'),
	ssid: z.number().int().optional().describe('Unique symbol identifier'),
	symbol: z.string().optional().describe('Ticker symbol'),
	totalVolume: z.number().int().optional().describe('Total volume for the day'),

	// Optional data blocks (presence depends on 'fields' and assetType)
	quote: QuoteBlockSchema.optional(),
	fundamental: QuotesFundamentalBlockSchema.optional(),
	extendedMarket: QuotesExtendedMarketBlockSchema.optional(),
	regularMarket: QuotesRegularMarketBlockSchema.optional(),
	reference: QuotesReferenceBlockSchema.optional(),
})

export const EquityResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.EQUITY),
	// Equity-specific fields can be added here if any are identified beyond the blocks
})
export type EquityResponseSchema = z.infer<typeof EquityResponseSchema>

export const OptionResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.OPTION),
	// Option-specific fields from screenshot
	delta: z.number().optional().describe('Delta value'),
	gamma: z.number().optional().describe('Gamma value'),
	theta: z.number().optional().describe('Theta value'),
	vega: z.number().optional().describe('Vega value'),
	rho: z.number().optional().describe('Rho value'),
	openInterest: z.number().int().optional().describe('Open interest'),
	timeValue: z.number().optional().describe('Time value'),
	underlyingPrice: z
		.number()
		.optional()
		.describe('Price of the underlying security'),
	strikePrice: z.number().optional().describe('Option strike price'),
	contractType: z
		.enum(['CALL', 'PUT'])
		.optional()
		.describe('Option contract type (CALL or PUT)'), // Example from screenshot
	expirationDate: isoDateTimeSchema
		.optional()
		.describe('Option expiration date'),
	daysToExpiration: z.number().int().optional().describe('Days to expiration'),
	intrinsicValue: z.number().optional().describe('Intrinsic value'),
	extrinsicValue: z
		.number()
		.optional()
		.describe('Extrinsic value / Time value'),
	multiplier: z.number().optional().describe('Option contract multiplier'),
	// 'volatility' is in QuoteBlockSchema and QuotesFundamentalBlockSchema, if it means something different here, specify.
})
export type OptionResponseSchema = z.infer<typeof OptionResponseSchema>

// --- Definitions for FutureResponse ---

// Schema for the "Quote" data block specific to Futures
export const QuoteFutureBlockSchema = z.object({
	description: z.string().optional().describe('Quote data of Future security'),
	askMICId: z.string().optional().describe('Ask MIC code'),
	askPrice: z.number().optional().describe('Current Best Ask Price'),
	askSize: z.number().int().optional().describe('Number of shares for ask'),
	askTime: z
		.number()
		.int()
		.optional()
		.describe('Last ask time in milliseconds since Epoch'),
	bidMICId: z.string().optional().describe('Bid MIC code'),
	bidPrice: z.number().optional().describe('Current Best Bid Price'),
	bidSize: z.number().int().optional().describe('Number of shares for bid'),
	bidTime: z
		.number()
		.int()
		.optional()
		.describe('Last bid time in milliseconds since Epoch'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	futurePercentChange: z.number().optional().describe('Net Percentage Change'), // As per image "futurePercentChange"
	highPrice: z.number().optional().describe("Day's high trade price"),
	lastMICId: z.string().optional().describe('Last MIC Code'),
	lastPrice: z.number().optional().describe('Price of the last trade'),
	lastSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares traded with last trade'),
	lowPrice: z.number().optional().describe("Day's low trade price"),
	mark: z.number().optional().describe('Mark price'),
	netChange: z
		.number()
		.optional()
		.describe('Current Last-Prev Close netChange'),
	openInterest: z.number().int().optional().describe('Open interest'),
	openPrice: z.number().optional().describe('Price at market open'),
	quoteTime: z
		.number()
		.int()
		.optional()
		.describe('Last quote time in milliseconds since Epoch'),
	quotedInSession: z
		.boolean()
		.optional()
		.describe('Quoted during trading session'),
	securityStatus: z.string().optional().describe('Status of security'),
	settleTime: z // Renamed from settlementPrice in FutureOption to settleTime as per Future image
		.number()
		.int()
		.optional()
		.describe('Settlement time in milliseconds since Epoch'),
	tick: z.number().optional().describe('Tick Price'),
	tickAmount: z.number().optional().describe('Tick Amount'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe(
			'Aggregated shares traded throughout the day, including pre/post market hours.',
		),
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
})
export type QuoteFutureBlockSchema = z.infer<typeof QuoteFutureBlockSchema>

// Schema for the "Reference" data block specific to Futures
export const ReferenceFutureBlockSchema = z.object({
	description: z.string().optional().describe('Description of Instrument'),
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
	futureActiveSymbol: z.string().optional().describe('Active symbol'),
	futureExpirationDate: epochMillisSchema
		.optional()
		.describe('Future expiration date in milliseconds since epoch'),
	futureIsActive: z.boolean().optional().describe('Future is active'),
	futureMultiplier: z.number().optional().describe('Future multiplier'),
	futurePriceFormat: z.string().optional().describe('Price format'),
	futureSettlementPrice: z
		.number()
		.optional()
		.describe('Future Settlement Price'),
	futureTradingHours: z.string().optional().describe('Trading Hours'),
	product: z.string().optional().describe('Futures product symbol'),
})
export type ReferenceFutureBlockSchema = z.infer<
	typeof ReferenceFutureBlockSchema
>

export const FutureResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FUTURE),
	assetMainType: z.literal(QuotesAssetMainTypeEnum.Enum.FUTURE).optional(),
	quote: QuoteFutureBlockSchema.optional(),
	reference: ReferenceFutureBlockSchema.optional(),
	// These are typically not applicable to Futures in the same way as Equity
	fundamental: z.undefined().optional(),
	extendedMarket: z.undefined().optional(),
	regularMarket: z.undefined().optional(),
})
export type FutureResponseSchema = z.infer<typeof FutureResponseSchema>

// --- Definitions for ForexResponse ---

// Schema for the "Quote" data block specific to Forex
export const QuoteForexBlockSchema = z.object({
	description: z.string().optional().describe('Quote data of Forex security'),
	'52WeekHigh': z
		.number()
		.optional()
		.describe('Highest price traded in the past 12 months, or 52 weeks'),
	'52WeekLow': z
		.number()
		.optional()
		.describe('Lowest price traded in the past 12 months, or 52 weeks'),
	askPrice: z.number().optional().describe('Current Best Ask Price'),
	askSize: z.number().int().optional().describe('Number of shares for ask'),
	bidPrice: z.number().optional().describe('Current Best Bid Price'),
	bidSize: z.number().int().optional().describe('Number of shares for bid'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	highPrice: z.number().optional().describe("Day's high trade price"),
	lastPrice: z.number().optional().describe('Last price'),
	lastSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares traded with last trade'),
	lowPrice: z.number().optional().describe("Day's low trade price"),
	mark: z.number().optional().describe('Mark price'),
	netChange: z.number().optional().describe('Current Last-Prev Close'),
	netPercentChange: z.number().optional().describe('Net Percentage Change'),
	openPrice: z.number().optional().describe('Price at market open'),
	quoteTime: z
		.number()
		.int()
		.optional()
		.describe('Last quote time in milliseconds since Epoch'),
	securityStatus: z.string().optional().describe('Status of security'),
	tick: z.number().optional().describe('Tick Price'),
	tickAmount: z.number().optional().describe('Tick Amount'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe(
			'Aggregated shares traded throughout the day, including pre/post market hours.',
		),
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
})
export type QuoteForexBlockSchema = z.infer<typeof QuoteForexBlockSchema>

// Schema for the "Reference" data block specific to Forex
export const ReferenceForexBlockSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Description of Instrument e.g. Euro/USDollar Spot'),
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
	isTradable: z.boolean().optional().describe('Is FOREX tradable'),
	marketMaker: z.string().optional().describe('Market maker'),
	product: z
		.string()
		.optional()
		.nullable()
		.describe('Product name (can be null)'),
	tradingHours: z.string().optional().describe('Trading hours'),
})
export type ReferenceForexBlockSchema = z.infer<
	typeof ReferenceForexBlockSchema
>

export const ForexResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FOREX),
	assetMainType: z.literal(QuotesAssetMainTypeEnum.Enum.FOREX).optional(),
	quote: QuoteForexBlockSchema.optional(),
	reference: ReferenceForexBlockSchema.optional(),
	// These are typically not applicable to Forex
	fundamental: z.undefined().optional(),
	extendedMarket: z.undefined().optional(),
	regularMarket: z.undefined().optional(),
})
export type ForexResponseSchema = z.infer<typeof ForexResponseSchema>

// Schema for the "Quote" data block specific to Mutual Funds
export const QuoteMutualFundBlockSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Quote data of Mutual Fund security'),
	'52WeekHigh': z
		.number()
		.optional()
		.describe('Highest price traded in the past 12 months, or 52 weeks'),
	'52WeekLow': z
		.number()
		.optional()
		.describe('Lowest price traded in the past 12 months, or 52 weeks'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	nAV: z.number().optional().describe('Net Asset Value'),
	netChange: z.number().optional().describe('Current Last-Prev Close'),
	netPercentChange: z.number().optional().describe('Net Percentage Change'),
	securityStatus: z.string().optional().describe('Status of security'), // e.g., Normal
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe(
			'Aggregated shares traded throughout the day, including pre/post market hours.',
		),
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
})
export type QuoteMutualFundBlockSchema = z.infer<
	typeof QuoteMutualFundBlockSchema
>

// Schema for the "Reference" data block specific to Mutual Funds
export const ReferenceMutualFundBlockSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Reference data of MutualFund security'),
	cusip: z.string().optional().describe('CUSIP of Instrument'),
	symbol: z.string().optional().describe('Symbol of Instrument'),
	securityType: z
		.string()
		.optional()
		.describe('Type of security e.g. Common Stock'),
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
})
export type ReferenceMutualFundBlockSchema = z.infer<
	typeof ReferenceMutualFundBlockSchema
>

// Updated MutualFundResponseSchema (defined AFTER its dependencies)
export const MutualFundResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.MUTUAL_FUND),
	assetSubType: MutualFundAssetSubTypeEnum.optional(),
	quote: QuoteMutualFundBlockSchema.optional(),
	fundamental: QuotesFundamentalBlockSchema.optional(),
	reference: ReferenceMutualFundBlockSchema.optional(),
	extendedMarket: z.undefined().optional(),
	regularMarket: z.undefined().optional(),
})
export type MutualFundResponseSchema = z.infer<typeof MutualFundResponseSchema>

// (Ensure ETFResponseSchema is defined here, before Index specific blocks if it was removed)
export const ETFResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.ETF),
	assetMainType: z.literal(QuotesAssetMainTypeEnum.Enum.ETF).optional(),
	// Similar to Equity, specific assetType. Add ETF-specific fields if any are identified.
})
export type ETFResponseSchema = z.infer<typeof ETFResponseSchema>

// --- Definitions for IndexResponse ---

// Schema for the "Quote" data block specific to Index
export const QuoteIndexBlockSchema = z.object({
	description: z.string().optional().describe('Quote data of Index security'),
	'52WeekHigh': z
		.number()
		.optional()
		.describe('Highest price traded in the past 12 months, or 52 weeks'),
	'52WeekLow': z
		.number()
		.optional()
		.describe('Lowest price traded in the past 12 months, or 52 weeks'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	highPrice: z.number().optional().describe("Day's high trade price"),
	lastPrice: z.number().optional().describe('Last price'),
	lowPrice: z.number().optional().describe("Day's low trade price"),
	netChange: z.number().optional().describe('Current Last-Prev Close'),
	netPercentChange: z.number().optional().describe('Net Percentage Change'),
	openPrice: z.number().optional().describe('Price at market open'),
	securityStatus: z.string().optional().describe('Status of security'), // e.g., Normal
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe(
			'Aggregated shares traded throughout the day, including pre/post market hours.',
		),
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
})
export type QuoteIndexBlockSchema = z.infer<typeof QuoteIndexBlockSchema>

// Schema for the "Reference" data block specific to Index
export const ReferenceIndexBlockSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Reference data of Index security'),
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
})
export type ReferenceIndexBlockSchema = z.infer<
	typeof ReferenceIndexBlockSchema
>

// Updated IndexResponseSchema (defined AFTER its dependencies)
export const IndexResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.INDEX),
	assetMainType: z.literal(QuotesAssetMainTypeEnum.Enum.INDEX).optional(),
	quote: QuoteIndexBlockSchema.optional(),
	reference: ReferenceIndexBlockSchema.optional(),
	fundamental: z.undefined().optional(),
	extendedMarket: z.undefined().optional(),
	regularMarket: z.undefined().optional(),
})
export type IndexResponseSchema = z.infer<typeof IndexResponseSchema>

// --- Definitions for FutureOptionResponse ---

// Schema for the "Quote" data block specific to Future Options
export const QuoteFutureOptionBlockSchema = z.object({
	description: z.string().optional().describe('Quote data of Option security'), // Screenshot says Option, assuming Future Option context
	askMICId: z.string().optional().describe('Ask MIC code'),
	askPrice: z.number().optional().describe('Current Best Ask Price'),
	askSize: z.number().int().optional().describe('Number of shares for ask'),
	bidMICId: z.string().optional().describe('Bid MIC code'),
	bidPrice: z.number().optional().describe('Current Best Bid Price'),
	bidSize: z.number().int().optional().describe('Number of shares for bid'),
	closePrice: z.number().optional().describe("Previous day's closing price"),
	highPrice: z.number().optional().describe("Day's high trade price"),
	lastMICId: z.string().optional().describe('Last MIC Code'),
	lastPrice: z.number().optional().describe('Last price'),
	lastSize: z
		.number()
		.int()
		.optional()
		.describe('Number of shares traded with last trade'),
	lowPrice: z.number().optional().describe("Day's low trade price"),
	mark: z.number().optional().describe('Mark price'),
	markChange: z.number().optional().describe('Mark Price change'),
	netChange: z
		.number()
		.optional()
		.describe('Current Last-Prev Close netChange'),
	netPercentChange: z.number().optional().describe('Net Percentage Change'),
	openInterest: z.number().int().optional().describe('Open Interest'),
	openPrice: z.number().optional().describe('Price at market open'),
	quoteTime: z
		.number()
		.int()
		.optional()
		.describe('Last quote time in milliseconds since Epoch'),
	securityStatus: z.string().optional().describe('Status of security'),
	settlementPrice: z.number().optional().describe('Settlement price'),
	tick: z.number().optional().describe('Tick Price'),
	tickAmount: z.number().optional().describe('Tick Amount'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe(
			'Aggregated shares traded throughout the day, including pre/post market hours.',
		),
	tradeTime: z
		.number()
		.int()
		.optional()
		.describe('Last trade time in milliseconds since Epoch'),
})
export type QuoteFutureOptionBlockSchema = z.infer<
	typeof QuoteFutureOptionBlockSchema
>

// Schema for the "Reference" data block specific to Future Options
export const ReferenceFutureOptionBlockSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Reference data of Future Option security'),
	contractType: z
		.enum(['P', 'C'])
		.optional()
		.describe('Indicates call or put (P, C)'),
	displayDescription: z
		.string()
		.optional()
		.describe('Description of instrument for display'), // Screenshot: 'description' field with value like 'AMZN Aug 20...'
	exchange: z.string().optional().describe('Exchange Code'),
	exchangeName: z.string().optional().describe('Exchange Name'),
	multiplier: z.number().optional().describe('Option multiplier'),
	expirationDate: epochMillisSchema
		.optional()
		.describe('Date of expiration in long (epoch ms)'), // $int64
	expirationStyle: z.string().optional().describe('Style of expiration'),
	strikePrice: z.number().optional().describe('Strike Price'),
	underlying: z.string().optional().describe('A company, index or fund name'),
})
export type ReferenceFutureOptionBlockSchema = z.infer<
	typeof ReferenceFutureOptionBlockSchema
>

// FutureOptionResponseSchema (defined AFTER its dependencies)
export const FutureOptionResponseSchema = BaseQuoteAssetResponseSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FUTURE_OPTION),
	assetMainType: z
		.literal(QuotesAssetMainTypeEnum.Enum.FUTURE_OPTION)
		.optional(), // Ensure FUTURE_OPTION is in QuotesAssetMainTypeEnum
	// ssid, symbol, realtime already in BaseQuoteAssetResponseSchema
	quote: QuoteFutureOptionBlockSchema.optional(),
	reference: ReferenceFutureOptionBlockSchema.optional(),

	// These are typically not applicable to FutureOptions in the same way as Equity
	fundamental: z.undefined().optional(),
	extendedMarket: z.undefined().optional(),
	regularMarket: z.undefined().optional(),
})
export type FutureOptionResponseSchema = z.infer<
	typeof FutureOptionResponseSchema
>

// --- Unified Quote Response Schema ---
// Instead of using a discriminated union, use a single flexible schema that works for all asset types
export const QuoteResponseSchema = BaseQuoteAssetResponseSchema.extend({
	// Asset-specific fields that might appear in any quote response
	// Option-specific fields
	delta: z.number().optional().describe('Delta value'),
	gamma: z.number().optional().describe('Gamma value'),
	theta: z.number().optional().describe('Theta value'),
	vega: z.number().optional().describe('Vega value'),
	rho: z.number().optional().describe('Rho value'),
	openInterest: z.number().int().optional().describe('Open interest'),
	timeValue: z.number().optional().describe('Time value'),
	underlyingPrice: z
		.number()
		.optional()
		.describe('Price of the underlying security'),
	strikePrice: z.number().optional().describe('Option strike price'),
	contractType: z
		.enum(['CALL', 'PUT'])
		.optional()
		.describe('Option contract type (CALL or PUT)'),
	expirationDate: isoDateTimeSchema
		.optional()
		.describe('Option expiration date'),
	daysToExpiration: z.number().int().optional().describe('Days to expiration'),
	intrinsicValue: z.number().optional().describe('Intrinsic value'),
	extrinsicValue: z
		.number()
		.optional()
		.describe('Extrinsic value / Time value'),
	multiplier: z.number().optional().describe('Option contract multiplier'),

	// Future-specific fields
	futurePercentChange: z.number().optional().describe('Net Percentage Change'),
	quotedInSession: z
		.boolean()
		.optional()
		.describe('Quoted during trading session'),
	tick: z.number().optional().describe('Tick Price'),
	tickAmount: z.number().optional().describe('Tick Amount'),

	// Any other fields that might appear
	nAV: z.number().optional().describe('Net Asset Value (for mutual funds)'),
})
export type QuoteResponseSchema = z.infer<typeof QuoteResponseSchema>

// --- Schema for Quote Errors ---
/**
 * Schema for symbol-level errors in quotes responses
 *
 * This schema represents the error format returned for individual symbols
 * in a quotes response, even when the overall HTTP status is 200 (success).
 *
 * The quotes endpoint is unique in that it can return a successful HTTP response
 * that contains a mix of successful quotes and individual symbol errors. This
 * is different from the standard `SchwabApiError` that would be thrown for a
 * failed request.
 *
 * To easily process these symbol-level errors, use the `extractQuoteErrors`
 * utility function from the quotes module.
 *
 * @see extractQuoteErrors
 */
export const QuoteErrorSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Error description for this specific symbol'),
	invalidCusips: z
		.array(z.string())
		.optional()
		.describe('List of invalid CUSIPs from request'),
	invalidSSIDs: z
		.array(z.number().int())
		.optional()
		.describe('List of invalid SSIDs from request'),
	invalidSymbols: z
		.array(z.string())
		.optional()
		.describe('List of invalid symbols from request'),
})
export type QuoteErrorSchema = z.infer<typeof QuoteErrorSchema>

// Path Parameters Schema for GET /quotes/{symbol_id}
export const GetQuoteBySymbolIdPathParams = z.object({
	symbol_id: z.string().describe('Symbol to get quote for'),
})
export type GetQuoteBySymbolIdPathParams = z.infer<
	typeof GetQuoteBySymbolIdPathParams
>

// Query Parameters Schema for GET /quotes/{symbol_id}
export const GetQuoteBySymbolIdQueryParams = z.object({
	fields: QuoteFieldsEnum.array()
		.optional()
		.describe(
			'Request for subset of data by passing comma separated list of root nodes. \n' +
				'For Fundamental Data: fundamental. For Fundamental and Reference combined: fundamental,reference. \n' +
				'Accepted root nodes for equities: quote, fundamental, extended, reference, regular.',
		),
})
export type GetQuoteBySymbolIdQueryParams = z.infer<
	typeof GetQuoteBySymbolIdQueryParams
>

// Request Params Schema for GET /quotes/{symbol_id} (merged path + query params)
export const GetQuoteBySymbolIdParams = z.object(
	mergeShapes(
		GetQuoteBySymbolIdQueryParams.shape,
		GetQuoteBySymbolIdPathParams.shape,
	),
)
export type GetQuoteBySymbolIdParams = z.infer<typeof GetQuoteBySymbolIdParams>

// Response Body Schema for GET /quotes/{symbol_id}
export const GetQuoteBySymbolIdResponse = QuoteResponseSchema
export type GetQuoteBySymbolIdResponse = z.infer<
	typeof GetQuoteBySymbolIdResponse
>

// --- GET /quotes endpoint schemas ---

// Path Parameters Schema for GET /quotes (no path params)
export const GetQuotesPathParams = z.object({})
export type GetQuotesPathParams = z.infer<typeof GetQuotesPathParams>

// Query Parameters Schema for GET /quotes
export const GetQuotesQueryParams = z.object({
	symbols: z
		.union([z.string(), z.array(z.string())])
		.transform((val) => (Array.isArray(val) ? val : [val]))
		.describe(
			'Symbols to get quotes for. Comma separated string or array of strings.',
		),
	fields: QuoteFieldsEnum.array()
		.optional()
		.describe(
			'Request for subset of data by passing comma separated list of root nodes. \n' +
				'For Fundamental Data: fundamental. For Fundamental and Reference combined: fundamental,reference. \n' +
				'Accepted root nodes for equities: quote, fundamental, extended, reference, regular.',
		),
	indicative: z
		.boolean()
		.optional()
		.describe(
			'Include indicative symbol quotes for all ETF symbols in request',
		),
})
export type GetQuotesQueryParams = z.infer<typeof GetQuotesQueryParams>

// Request Params Schema for GET /quotes (merged path + query params)
export const GetQuotesParams = z.object(
	mergeShapes(GetQuotesQueryParams.shape, GetQuotesPathParams.shape),
)
export type GetQuotesParams = z.infer<typeof GetQuotesParams>

// Response Body Schema for GET /quotes
export const GetQuotesResponse = z.record(z.string(), QuoteResponseSchema)
export type GetQuotesResponse = z.infer<typeof GetQuotesResponse>
