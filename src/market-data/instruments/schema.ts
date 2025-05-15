import { z } from 'zod'

// Enum for projection parameter
export const InstrumentProjectionEnum = z.enum([
	'symbol-search',
	'symbol-regex',
	'desc-search',
	'desc-regex',
	'search',
	'fundamental',
])
export type InstrumentProjectionEnum = z.infer<typeof InstrumentProjectionEnum>

// Enum for AssetType
export const InstrumentAssetTypeEnum = z.enum([
	'BOND',
	'EQUITY',
	'ETF',
	'EXTENDED', // Assuming EXTENDED is a valid type, present in screenshot Fundamental section
	'FOREX',
	'FUTURE',
	'FUTURE_OPTION',
	'FUNDAMENTAL', // This seems like a special type for the projection, also listed as an assetType
	'INDEX',
	'INDICATOR',
	'MUTUAL_FUND',
	'OPTION',
	'UNKNOWN',
])
export type InstrumentAssetTypeEnum = z.infer<typeof InstrumentAssetTypeEnum>

// Base Instrument Schema
const InstrumentInfoSchema = z.object({
	symbol: z.string(),
	description: z.string(),
	assetType: InstrumentAssetTypeEnum,
	cusip: z.string().optional(), // from example, though not in screenshot
	exchange: z.string().optional(), // from screenshot
})
type InstrumentInfoSchema = z.infer<typeof InstrumentInfoSchema>

// Schema for Fundamental Data
const FundamentalDataSchema = z.object({
	symbol: z.string(),
	high52: z.number().optional(),
	low52: z.number().optional(),
	dividendAmount: z.number().optional(),
	dividendYield: z.number().optional(),
	dividendDate: z.string().optional(), // Assuming string, could be date
	peRatio: z.number().optional(),
	pegRatio: z.number().optional(),
	pbRatio: z.number().optional(),
	pcRatio: z.number().optional(),
	prRatio: z.number().optional(), // Assuming this is Price to Revenue (P/R)
	marketCap: z.number().optional(), // In screenshot as MarketCap under FundamentalData
	mark: z.number().optional(),
	netChange: z.number().optional(),
	volatility: z.number().optional(),
	beta: z.number().optional(),
	bidPrice: z.number().optional(),
	askPrice: z.number().optional(),
	lastPrice: z.number().optional(),
	openPrice: z.number().optional(),
	closePrice: z.number().optional(),
	netPercentChangeInDouble: z.number().optional(),
	netChangeInDouble: z.number().optional(),
	bidSize: z.number().int().optional(),
	askSize: z.number().int().optional(),
	highPrice: z.number().optional(),
	lowPrice: z.number().optional(),
	lastSize: z.number().int().optional(),
	quoteTimeInLong: z.number().int().optional(),
	tradeTimeInLong: z.number().int().optional(),
	lastTradeTime: z.string().datetime({ offset: true }).optional(), // Assuming ISO string with offset
	grossMarginTTM: z.number().optional(),
	grossMarginMRQ: z.number().optional(),
	netProfitMarginTTM: z.number().optional(),
	netProfitMarginMRQ: z.number().optional(),
	operatingMarginTTM: z.number().optional(),
	operatingMarginMRQ: z.number().optional(),
	revenuePerShareTTM: z.number().optional(),
	revenueTTM: z.number().optional(),
	roa: z.number().optional(), // Return on Assets
	roe: z.number().optional(), // Return on Equity
	roi: z.number().optional(), // Return on Investment
	epsTTM: z.number().optional(),
	epsChangePercentTTM: z.number().optional(),
	epsChangeYear: z.number().optional(),
	epsChangePercentYear: z.number().optional(),
	revChangeYear: z.number().optional(),
	revChangeTTM: z.number().optional(),
	revChangeIn: z.number().optional(), // Assuming number based on similar fields
	sharesOutstanding: z.number().optional(),
	marketCapFloat: z.number().optional(),
	bookValuePerShare: z.number().optional(),
	shortIntToFloat: z.number().optional(),
	shortIntDayToCover: z.number().optional(),
	dividendPayAmount: z.number().optional(),
	dividendGrowthRate3Year: z.number().optional(),
	dividendPayDate: z.string().optional(), // Assuming string, could be date
	betaText: z.string().optional(), // Assuming 'beta' is numeric and there might be a text version or this is a typo in image
	avg10DaysVolume: z.number().int().optional(), // From screenshot, avgVol3MonthAvg and avgVol10DayAvg
	avg1DayVolume: z.number().int().optional(), // Placeholder, not in screenshot directly but good to have
	avg3MonthVolume: z.number().int().optional(), // Renamed from vol3MonthAvg to follow camelCase
	avg1YearVolume: z.number().int().optional(), // Placeholder
	vol1DayAvg: z.number().int().optional(),
	vol10DayAvg: z.number().int().optional(),
	vol3MonthAvg: z.number().int().optional(),
	week52HighDate: z.string().optional(), // Assuming string, could be date
	week52LowDate: z.string().optional(), // Assuming string, could be date
	divYield: z.number().optional(), // Duplicate of dividendYield, using one
	divAmount: z.number().optional(), // Duplicate of dividendAmount, using one
	divFreq: z.number().int().optional(),
	divExDate: z.string().optional(), // Assuming string, could be date
	corpActionDate: z.string().optional(), // Assuming string, could be date
	lastTradingDay: z.string().optional(), // Assuming string, could be date
	nextEarningDate: z.string().optional(), // Assuming string, could be date
	nextDividendPayDate: z.string().optional(), // Assuming string, could be date
	nextDividendDate: z.string().optional(), // Assuming string, could be date
	lastDividendDate: z.string().optional(), // Assuming string, could be date
	fundStrategy: z.string().optional(),
	fundFamily: z.string().optional(),
	fundLeverage: z.string().optional(),
	fundType: z.string().optional(),
})
export type FundamentalDataSchema = z.infer<typeof FundamentalDataSchema>

// Specific Instrument Types
const FundamentalInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FUNDAMENTAL),
	fundamental: FundamentalDataSchema,
})
export type FundamentalInstrumentSchema = z.infer<
	typeof FundamentalInstrumentSchema
>

const BondInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.BOND),
	bondFactor: z.string().optional(), // From screenshot, under BondInstrumentInfo
	bondMultiplier: z.string().optional(), // From screenshot
	bondPrice: z.number().optional(), // From screenshot
})
export type BondInstrumentSchema = z.infer<typeof BondInstrumentSchema>

const EquityInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.EQUITY),
})
export type EquityInstrumentSchema = z.infer<typeof EquityInstrumentSchema>

const ETFInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.ETF),
})
export type ETFInstrumentSchema = z.infer<typeof ETFInstrumentSchema>

const ForexInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FOREX),
})
export type ForexInstrumentSchema = z.infer<typeof ForexInstrumentSchema>

const FutureInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FUTURE),
})
export type FutureInstrumentSchema = z.infer<typeof FutureInstrumentSchema>

const FutureOptionInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.FUTURE_OPTION),
})
export type FutureOptionInstrumentSchema = z.infer<
	typeof FutureOptionInstrumentSchema
>

const IndexInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.INDEX),
})
export type IndexInstrumentSchema = z.infer<typeof IndexInstrumentSchema>

const IndicatorInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.INDICATOR),
})
export type IndicatorInstrumentSchema = z.infer<
	typeof IndicatorInstrumentSchema
>

const MutualFundInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.MUTUAL_FUND),
})
export type MutualFundInstrumentSchema = z.infer<
	typeof MutualFundInstrumentSchema
>

const OptionInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.OPTION),
})
export type OptionInstrumentSchema = z.infer<typeof OptionInstrumentSchema>

const UnknownInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.UNKNOWN),
})
export type UnknownInstrumentSchema = z.infer<typeof UnknownInstrumentSchema>

// Extended type from screenshot, assuming it extends base like others
const ExtendedInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.EXTENDED),
})
export type ExtendedInstrumentSchema = z.infer<typeof ExtendedInstrumentSchema>

// Discriminated Union for any Instrument type
// Note: FUNDAMENTAL is an assetType and also indicates the presence of the 'fundamental' field.
// The screenshot suggests that when projection=fundamental, the assetType might still be EQUITY, BOND etc.
// but it will be wrapped or contain the fundamental data.
// For now, making FUNDAMENTAL a distinct assetType which includes the fundamental block.
// If an EQUITY with fundamental data is needed, the API response structure needs clarification.
// The screenshot for InstrumentResponse shows 'InstrumentInfo' and 'FundamentalInstrument' as choices for items in 'instruments' array.
// InstrumentInfo itself has an assetType. FundamentalInstrument *also* has an assetType.
// This implies FundamentalInstrument is a *type* of instrument, not just a data block.

const InstrumentSchema = z.discriminatedUnion('assetType', [
	FundamentalInstrumentSchema,
	BondInstrumentSchema,
	EquityInstrumentSchema,
	ETFInstrumentSchema,
	ForexInstrumentSchema,
	FutureInstrumentSchema,
	FutureOptionInstrumentSchema,
	IndexInstrumentSchema,
	IndicatorInstrumentSchema,
	MutualFundInstrumentSchema,
	OptionInstrumentSchema,
	UnknownInstrumentSchema,
	ExtendedInstrumentSchema, // Added from enum
])
export type InstrumentSchema = z.infer<typeof InstrumentSchema>

// Request Query Parameters Schema
export const GetInstrumentsRequestQueryParamsSchema = z.object({
	symbol: z.string().describe('Symbol of a security'),
	projection: InstrumentProjectionEnum.describe(
		`Search by: ${InstrumentProjectionEnum.options.join(', ')}`,
	),
})
export type GetInstrumentsRequestQueryParamsSchema = z.infer<
	typeof GetInstrumentsRequestQueryParamsSchema
>

// Response Schema for /instruments
// The screenshot shows the top level response object is InstrumentResponse, which contains an array of instruments.
export const InstrumentsResponseSchema = z.object({
	instruments: z.array(InstrumentSchema),
})
export type InstrumentsResponseSchema = z.infer<
	typeof InstrumentsResponseSchema
>

// Request Path Parameters Schema for /instruments/{cusip_id}
export const GetInstrumentByCusipRequestPathParamsSchema = z.object({
	cusip_id: z.string().describe('CUSIP of a security'),
})
export type GetInstrumentByCusipRequestPathParamsSchema = z.infer<
	typeof GetInstrumentByCusipRequestPathParamsSchema
>

// Response Body Schema for /instruments/{cusip_id}
// This endpoint returns an object with an "instruments" array, similar to /instruments,
// typically containing a single instrument matching the CUSIP.
export const GetInstrumentByCusipResponseBodySchema = InstrumentsResponseSchema
export type GetInstrumentByCusipResponseBodySchema = z.infer<
	typeof GetInstrumentByCusipResponseBodySchema
>

// It seems the example response shows a dynamic key based on the query itself:
// "symbolsAAPL,BAC&projection=symbol-search": { "instruments": [] }
// If this is the case, the response schema needs to be z.record(z.string(), InstrumentsResponseSchema)
// However, the "Schema" panel shows a direct "InstrumentResponse" object.
// Assuming the "Schema" panel is the source of truth for the direct response structure.
// If the key is indeed dynamic, the endpoint definition would need to handle this.
// For now, following the explicit schema structure shown.

// The example from the image: "Example Value / Schema" shows "InstrumentResponse" as the top level.
// And "instruments" as a field in it.
// The schema for 'instruments' items: one of {InstrumentInfo, FundamentalInstrument, BondInstrumentInfo ...}
// This implies that the discriminated union is correct.
// BondInstrumentInfo in the screenshot shows fields like bondFactor, bondMultiplier, bondPrice
// these are added to BondInstrumentSchema.
// FundamentalInstrument in the screenshot shows 'fundamental: FundamentalList'. I defined FundamentalDataSchema.
// The screenshot also lists InstrumentInfo for types like EQUITY, ETF etc. This is handled by specific schemas
// extending InstrumentInfoSchema and setting the literal assetType.
