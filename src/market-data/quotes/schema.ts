import { z } from 'zod'
import { InstrumentAssetTypeEnum } from '../instruments/schema' // Reusing for assetType

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
	askTime: z
		.number()
		.int()
		.optional()
		.describe('Last ask time in milliseconds since Epoch'),
	bidMICId: z.string().optional().describe('Bid Market Identifier Code'),
	bidPrice: z.number().optional().describe('Current Bid Price'),
	bidSize: z.number().int().optional().describe('Number of shares for bid'),
	bidTime: z
		.number()
		.int()
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
	quoteTime: z
		.number()
		.int()
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
	tradeTime: z
		.number()
		.int()
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
	declarationDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Declaration date in yyyy-MM-dd'T'HH:mm:ssZ format"),
	divAmount: z.number().optional().describe('Dividend Amount'),
	divExDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Dividend Ex-Date in yyyy-MM-dd'T'HH:mm:ssZ format"),
	divFreq: z
		.number()
		.int()
		.optional()
		.describe(
			'Dividend Frequency (e.g., 1=annual, 2=semi-annual, 4=quarterly, 12=monthly)',
		),
	dividendPayAmount: z.number().optional().describe('Dividend Pay Amount'),
	dividendPayDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Dividend Pay Date in yyyy-MM-dd'T'HH:mm:ssZ format"),
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
	lastEarningsDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Last earnings date in yyyy-MM-dd'T'HH:mm:ssZ format"),
	low52: z
		.number()
		.optional()
		.describe('Lowest price traded in the past 12 months'),
	marketCap: z.number().optional().describe('Market Capitalization'),
	nextDivExDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Next Dividend Ex-Date in yyyy-MM-dd'T'HH:mm:ssZ format"),
	nextDivPayDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Next Dividend Pay Date in yyyy-MM-dd'T'HH:mm:ssZ format"),
	pbRatio: z.number().optional().describe('Price to Book Ratio'),
	peRatio: z.number().optional().describe('Price to Earnings Ratio'),
	pegRatio: z.number().optional().describe('Price to Earnings Growth Ratio'),
	prRatio: z.number().optional().describe('Price to Revenue Ratio'),
	qualifier: z.string().optional().describe('Qualifier code'),
	volatility: z.number().optional().describe('Volatility measurement'),
	week52HighDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Date of 52 week high in yyyy-MM-dd'T'HH:mm:ssZ format"),
	week52LowDate: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe("Date of 52 week low in yyyy-MM-dd'T'HH:mm:ssZ format"),
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
	quoteTime: z
		.number()
		.int()
		.optional()
		.describe('Extended market quote time in milliseconds since Epoch'),
	totalVolume: z
		.number()
		.int()
		.optional()
		.describe('Extended market total volume'),
	tradeTime: z
		.number()
		.int()
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
	tradeTime: z
		.number()
		.int()
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

// Base for common fields across different quote responses
const BaseQuoteAssetResponseSchema = z.object({
	assetType: InstrumentAssetTypeEnum.describe("Instrument's asset type"),
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
	realtime: z.boolean().optional().describe('Is quote realtime'),
	securityStatus: z.string().optional().describe('Security trading status'),
	ssid: z.number().int().optional().describe('Unique symbol identifier'),
	symbol: z.string().describe('Ticker symbol'),
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
	expirationDate: z
		.string()
		.datetime({ offset: true })
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
	futureExpirationDate: z
		.number()
		.int()
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
	expirationDate: z
		.number()
		.int()
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

// --- Update DiscriminatedQuoteResponseSchema ---
// Replace the placeholder for FUTURE_OPTION with the new FutureOptionResponseSchema.
export const DiscriminatedQuoteResponseSchema = z.discriminatedUnion(
	'assetType',
	[
		EquityResponseSchema,
		OptionResponseSchema,
		ForexResponseSchema,
		FutureResponseSchema,
		FutureOptionResponseSchema,
		IndexResponseSchema,
		MutualFundResponseSchema,
	],
)
export type DiscriminatedQuoteResponseSchema = z.infer<
	typeof DiscriminatedQuoteResponseSchema
>

// --- Schema for Quote Errors ---
export const QuoteErrorSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Partial or Custom errors per request'),
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
	// The screenshot implies QuoteError might also have an assetType or similar discriminator if it needs to fit into a union seamlessly without an explicit wrapper.
	// However, based on the structure provided, it seems to be a distinct object.
	// If it needs to be part of the DiscriminatedQuoteResponseSchema, it would need an 'assetType' field.
	// For now, defining it as a separate object to be unioned at the record value level.
})
export type QuoteErrorSchema = z.infer<typeof QuoteErrorSchema>

// Schema for Request Query Parameters of GET /quotes
export const GetQuotesRequestQueryParamsSchema = z.object({
	symbols: z
		.string()
		.describe(
			'Comma separated list of symbols to look up a quote. Example: MSFT,AAPL,GOOG',
		),
	fields: QuoteFieldsEnum.optional()
		.default('all')
		.describe(
			"Request for subset of data. Possible values are quote, fundamental, extended, reference, regular. Send 'all' for full response.",
		),
	indicative: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			'Include indicative symbol quotes for all ETF symbols in request.',
		),
})
export type GetQuotesRequestQueryParamsSchema = z.infer<
	typeof GetQuotesRequestQueryParamsSchema
>

// Updated Schema for the Response Body of GET /quotes
// Each symbol in the response can now be either a valid quote (DiscriminatedQuoteResponseSchema) or a QuoteErrorSchema.
export const GetQuotesResponseBodySchema = z.record(
	z.string(),
	z.union([DiscriminatedQuoteResponseSchema, QuoteErrorSchema]),
)
export type GetQuotesResponseBodySchema = z.infer<
	typeof GetQuotesResponseBodySchema
>

// --- Schemas for GET /{symbol_id}/quotes ---

// Path Parameters Schema for GET /{symbol_id}/quotes
export const GetQuoteBySymbolIdRequestPathParamsSchema = z.object({
	symbol_id: z.string().describe('Symbol of instrument to get a quote for'),
})
export type GetQuoteBySymbolIdRequestPathParamsSchema = z.infer<
	typeof GetQuoteBySymbolIdRequestPathParamsSchema
>

// Query Parameters Schema for GET /{symbol_id}/quotes
export const GetQuoteBySymbolIdRequestQueryParamsSchema = z.object({
	fields: QuoteFieldsEnum.optional()
		.default('all')
		.describe(
			"Request for subset of data. Possible values are quote, fundamental, extended, reference, regular. Send 'all' for full response.",
		),
})
export type GetQuoteBySymbolIdRequestQueryParamsSchema = z.infer<
	typeof GetQuoteBySymbolIdRequestQueryParamsSchema
>

// Response Body Schema for GET /{symbol_id}/quotes
// The response structure is the same as GET /quotes, but typically for a single symbol in the record.
export const GetQuoteBySymbolIdResponseBodySchema = GetQuotesResponseBodySchema
export type GetQuoteBySymbolIdResponseBodySchema = z.infer<
	typeof GetQuoteBySymbolIdResponseBodySchema
>
