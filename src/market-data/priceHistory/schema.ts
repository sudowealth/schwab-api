import { z } from 'zod'
import {
	dateStringSchema,
	epochMillisSchema,
	DateFormatType,
	dateTransformer,
	createQueryDateSchema
} from '../../utils/date-utils'

// Enum for periodType query parameter
export const PriceHistoryPeriodTypeEnum = z.enum([
	'day',
	'month',
	'year',
	'ytd',
])
export type PriceHistoryPeriodTypeEnum = z.infer<
	typeof PriceHistoryPeriodTypeEnum
>

// Enum for frequencyType query parameter
export const PriceHistoryFrequencyTypeEnum = z.enum([
	'minute',
	'daily',
	'weekly',
	'monthly',
])
export type PriceHistoryFrequencyTypeEnum = z.infer<
	typeof PriceHistoryFrequencyTypeEnum
>

// Enum for frequency query parameter
export const FrequencyEnum = z
	.union([
		z.literal(1),
		z.literal(5),
		z.literal(10),
		z.literal(15),
		z.literal(30),
	])
	.or(z.coerce.number().refine((val) => [1, 5, 10, 15, 30].includes(val)))
export type FrequencyEnum = z.infer<typeof FrequencyEnum>

// Enum for period query parameter
export const PeriodEnum = z
	.union([
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(5),
		z.literal(6),
		z.literal(10),
		z.literal(15),
		z.literal(20),
	])
	.or(
		z.coerce
			.number()
			.refine((val) => [1, 2, 3, 4, 5, 6, 10, 15, 20].includes(val)),
	)
export type PeriodEnum = z.infer<typeof PeriodEnum>

// Schema for Request Query Parameters of GET /pricehistory
export const GetPriceHistoryRequestQueryParamsSchema = z.object({
	symbol: z
		.string()
		.describe('The Equity symbol used to look up price history. Example: AAPL'),
	periodType: PriceHistoryPeriodTypeEnum.optional().describe(
		'The chart period being requested. Available values: day, month, year, ytd',
	),
	period: PeriodEnum.default(1)
		.optional()
		.describe(
			'The number of chart period types. \n' +
				'- If periodType is day - valid values are 1, 2, 3, 4, 5, 10 (default 10). \n' +
				'- If periodType is month - valid values are 1, 2, 3, 6 (default 1). \n' +
				'- If periodType is year - valid values are 1, 2, 3, 5, 10, 15, 20 (default 1). \n' +
				'- If periodType is ytd - valid values are 1 (default 1).',
		),
	frequencyType: PriceHistoryFrequencyTypeEnum.optional().describe(
		'The time frequencyType. \n' +
			'- If periodType is day - default is minute. \n' +
			'- If periodType is month - default is weekly. \n' +
			'- If periodType is year - default is monthly. \n' +
			'- If periodType is ytd - default is weekly. Note: When periodType is ytd, valid values for frequencyType are daily or weekly. \n' +
			'General available values: minute, daily, weekly, monthly (specific restrictions may apply based on periodType).',
	),
	frequency: FrequencyEnum.optional()
		.default(1)
		.describe(
			'The time frequency duration. Default value is 1 if not specified. \n' +
				'- If frequencyType is minute - valid values are 1, 5, 10, 15, 30. \n' +
				'- If frequencyType is daily - valid value is 1. \n' +
				'- If frequencyType is weekly - valid value is 1. \n' +
				'- If frequencyType is monthly - valid value is 1.',
		),
	startDate: createQueryDateSchema()
		.describe('The start date, either as YYYY-MM-DD string or milliseconds since epoch'),
	endDate: createQueryDateSchema()
		.describe(
			'The end date, either as YYYY-MM-DD string or milliseconds since epoch. \n' +
				'If not specified, the endDate will default to the market close of previous business day.',
		),
	needExtendedHoursData: z
		.boolean()
		.optional()
		.describe('Need extended hours data'),
	needPreviousClose: z
		.boolean()
		.optional()
		.describe('Need previous close price/date'),
})
export type GetPriceHistoryRequestQueryParamsSchema = z.infer<
	typeof GetPriceHistoryRequestQueryParamsSchema
>

// Schema for a single candle in the PriceHistory response
export const PriceHistoryCandleSchema = z.object({
	open: z.number().describe('Open price for the period'),
	high: z.number().describe('High price for the period'),
	low: z.number().describe('Low price for the period'),
	close: z.number().describe('Close price for the period'),
	volume: z.number().int().describe('Volume for the period'),
	datetime: epochMillisSchema.describe('Timestamp in EPOCH milliseconds'),
	datetimeISO8601: dateStringSchema
		.optional()
		.describe('Timestamp in YYYY-MM-DD format'),
})
export type PriceHistoryCandleSchema = z.infer<typeof PriceHistoryCandleSchema>

// Schema for the Response Body of GET /pricehistory
export const GetPriceHistoryResponseBodySchema = z.object({
	candles: z
		.array(PriceHistoryCandleSchema)
		.describe('Array of price history candles'),
	symbol: z.string().describe('The symbol for which price history was fetched'),
	empty: z
		.boolean()
		.describe('True if no candles were returned for the request'),
	previousClose: z
		.number()
		.optional()
		.describe("Previous session's close price"),
	previousCloseDate: epochMillisSchema
		.optional()
		.describe("Previous session's close date (epoch ms)"),
	previousCloseDateISO8601: dateStringSchema
		.optional()
		.describe("Previous session's close date (YYYY-MM-DD)"),
})
export type GetPriceHistoryResponseBodySchema = z.infer<
	typeof GetPriceHistoryResponseBodySchema
>
