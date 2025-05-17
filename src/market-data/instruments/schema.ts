import { z } from 'zod'
import { BaseInstrumentSchema } from '../../schemas/base/base-instrument.schema'

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

// Enum for AssetType specifically used in market-data/instruments
export const InstrumentAssetTypeEnum = z.enum([
	'BOND',
	'EQUITY',
	'ETF',
	'EXTENDED',
	'FOREX',
	'FUTURE',
	'FUTURE_OPTION',
	'FUNDAMENTAL',
	'INDEX',
	'INDICATOR',
	'MUTUAL_FUND',
	'OPTION',
	'UNKNOWN',
])
export type InstrumentAssetTypeEnum = z.infer<typeof InstrumentAssetTypeEnum>

// Market-data specific InstrumentInfo Schema that extends the base schema
const InstrumentInfoSchema = BaseInstrumentSchema.pick({
	symbol: true,
	description: true,
	cusip: true,
	exchange: true,
}).extend({
	assetType: InstrumentAssetTypeEnum,
})
type InstrumentInfoSchema = z.infer<typeof InstrumentInfoSchema>

// Schema for Fundamental Data
const FundamentalDataSchema = z.object({
	symbol: z.string(),
	high52: z.number().optional(),
	low52: z.number().optional(),
	dividendAmount: z.number().optional(),
	dividendYield: z.number().optional(),
	dividendDate: z.string().optional(),
	peRatio: z.number().optional(),
	pegRatio: z.number().optional(),
	pbRatio: z.number().optional(),
	pcRatio: z.number().optional(),
	prRatio: z.number().optional(),
	marketCap: z.number().optional(),
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
	lastTradeTime: z.string().datetime({ offset: true }).optional(),
	grossMarginTTM: z.number().optional(),
	grossMarginMRQ: z.number().optional(),
	netProfitMarginTTM: z.number().optional(),
	netProfitMarginMRQ: z.number().optional(),
	operatingMarginTTM: z.number().optional(),
	operatingMarginMRQ: z.number().optional(),
	revenuePerShareTTM: z.number().optional(),
	revenueTTM: z.number().optional(),
	roa: z.number().optional(),
	roe: z.number().optional(),
	roi: z.number().optional(),
	epsTTM: z.number().optional(),
	epsChangePercentTTM: z.number().optional(),
	epsChangeYear: z.number().optional(),
	epsChangePercentYear: z.number().optional(),
	revChangeYear: z.number().optional(),
	revChangeTTM: z.number().optional(),
	revChangeIn: z.number().optional(),
	sharesOutstanding: z.number().optional(),
	marketCapFloat: z.number().optional(),
	bookValuePerShare: z.number().optional(),
	shortIntToFloat: z.number().optional(),
	shortIntDayToCover: z.number().optional(),
	dividendPayAmount: z.number().optional(),
	dividendGrowthRate3Year: z.number().optional(),
	dividendPayDate: z.string().optional(),
	betaText: z.string().optional(),
	avg10DaysVolume: z.number().int().optional(),
	avg1DayVolume: z.number().int().optional(),
	avg3MonthVolume: z.number().int().optional(),
	avg1YearVolume: z.number().int().optional(),
	vol1DayAvg: z.number().int().optional(),
	vol10DayAvg: z.number().int().optional(),
	vol3MonthAvg: z.number().int().optional(),
	week52HighDate: z.string().optional(),
	week52LowDate: z.string().optional(),
	divYield: z.number().optional(),
	divAmount: z.number().optional(),
	divFreq: z.number().int().optional(),
	divExDate: z.string().optional(),
	corpActionDate: z.string().optional(),
	lastTradingDay: z.string().optional(),
	nextEarningDate: z.string().optional(),
	nextDividendPayDate: z.string().optional(),
	nextDividendDate: z.string().optional(),
	lastDividendDate: z.string().optional(),
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
	bondFactor: z.string().optional(),
	bondMultiplier: z.string().optional(),
	bondPrice: z.number().optional(),
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

const ExtendedInstrumentSchema = InstrumentInfoSchema.extend({
	assetType: z.literal(InstrumentAssetTypeEnum.Enum.EXTENDED),
})
export type ExtendedInstrumentSchema = z.infer<typeof ExtendedInstrumentSchema>

// Discriminated Union for any Instrument type
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
	ExtendedInstrumentSchema,
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
export const GetInstrumentByCusipResponseBodySchema = InstrumentsResponseSchema
export type GetInstrumentByCusipResponseBodySchema = z.infer<
	typeof GetInstrumentByCusipResponseBodySchema
>
