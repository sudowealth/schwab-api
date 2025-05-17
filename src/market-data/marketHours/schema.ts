import { z } from 'zod'
import { dateStringSchema } from '../../utils/date-utils'
import { InstrumentAssetTypeEnum } from '../instruments/schema' // Reusing for marketType in response

// Enum for the 'markets' query parameter
export const MarketHoursMarketQueryEnum = z.enum([
	'equity',
	'option',
	'bond',
	'future',
	'forex',
])
export type MarketHoursMarketQueryEnum = z.infer<
	typeof MarketHoursMarketQueryEnum
>

// Schema for time string (HH:mm:ss)
const timeStringSchema = z
	.string()
	.regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:mm:ss format')

// Schema for session interval (start and end times)
const SessionIntervalSchema = z.object({
	start: timeStringSchema.describe('Session start time (HH:mm:ss)'),
	end: timeStringSchema.describe('Session end time (HH:mm:ss)'),
})
export type SessionIntervalSchema = z.infer<typeof SessionIntervalSchema>

// Schema for sessionHours (e.g., { regularMarket: [{start, end}] })
const MarketSessionHoursSchema = z.record(
	z.string(), // Session name (e.g., "preMarket", "regularMarket", "postMarket")
	z.array(SessionIntervalSchema),
)
export type MarketSessionHoursSchema = z.infer<typeof MarketSessionHoursSchema>

// Schema for the data of a single market in the response
export const MarketHoursDataSchema = z.object({
	date: dateStringSchema
		.optional()
		.describe('Date for the market hours (Date object)'), // Optional as per example where it might be part of equity.date
	marketType: InstrumentAssetTypeEnum.describe('Type of market'),
	exchange: z.string().optional().describe('Exchange name'),
	category: z.string().optional().describe('Category of the market'),
	product: z.string().optional().describe('Product name'),
	productName: z.string().optional().describe('Display name for the product'),
	isOpen: z.boolean().describe('Indicates if the market is currently open'),
	sessionHours: MarketSessionHoursSchema.optional().describe(
		'Market session hours',
	),
})
export type MarketHoursDataSchema = z.infer<typeof MarketHoursDataSchema>

// Schema for Request Query Parameters of GET /markets
export const GetMarketHoursRequestQueryParamsSchema = z.object({
	markets: z
		.union([MarketHoursMarketQueryEnum, z.array(MarketHoursMarketQueryEnum)])
		.transform((val) => (Array.isArray(val) ? val : [val]))
		.describe(
			`List of markets. Available values: ${MarketHoursMarketQueryEnum.options.join(', ')}`,
		),
	date: dateStringSchema
		.optional()
		.describe('Date for market hours. Defaults to current day.'),
})
export type GetMarketHoursRequestQueryParamsSchema = z.infer<
	typeof GetMarketHoursRequestQueryParamsSchema
>

// Schema for Response Body of GET /markets
// The response is a nested structure with market type as the top level key,
// then product code as second level, containing the market hours data
export const GetMarketHoursResponseBodySchema = z.record(
	MarketHoursMarketQueryEnum, // Top level key (e.g., "equity")
	z.record(
		z.string(), // Second level key (e.g., "EQ") - product code
		MarketHoursDataSchema, // Market hours data
	),
)
export type GetMarketHoursResponseBodySchema = z.infer<
	typeof GetMarketHoursResponseBodySchema
>

// Path Parameters Schema for GET /markets/{market_id}
export const GetMarketHoursByMarketIdRequestPathParamsSchema = z.object({
	market_id: MarketHoursMarketQueryEnum.describe(
		'Market ID (equity, option, etc.)',
	),
})
export type GetMarketHoursByMarketIdRequestPathParamsSchema = z.infer<
	typeof GetMarketHoursByMarketIdRequestPathParamsSchema
>

// Query Parameters Schema for GET /markets/{market_id}
export const GetMarketHoursByMarketIdRequestQueryParamsSchema = z.object({
	date: dateStringSchema
		.optional()
		.describe('Date for market hours. Defaults to current day.'),
})
export type GetMarketHoursByMarketIdRequestQueryParamsSchema = z.infer<
	typeof GetMarketHoursByMarketIdRequestQueryParamsSchema
>

// Response Body Schema for GET /markets/{market_id}
// This endpoint returns a nested structure with market type as the top level key,
// then product code as second level, containing the market hours data
export const GetMarketHoursByMarketIdResponseBodySchema = z.record(
	MarketHoursMarketQueryEnum, // Top level key (e.g., "equity")
	z.record(
		z.string(), // Second level key (e.g., "EQ") - product code
		MarketHoursDataSchema, // Market hours data
	),
)
export type GetMarketHoursByMarketIdResponseBodySchema = z.infer<
	typeof GetMarketHoursByMarketIdResponseBodySchema
>
