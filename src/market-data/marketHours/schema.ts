import { z } from 'zod'
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

// Schema for session interval (start and end times)
const SessionIntervalSchema = z.object({
	start: z.string().describe('Session start time'), // e.g., "YYYY-MM-DDTHH:mm:ssZ" or "HH:mm:ss"
	end: z.string().describe('Session end time'), // e.g., "YYYY-MM-DDTHH:mm:ssZ" or "HH:mm:ss"
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
	date: z.string().optional().describe('Date for the market hours, YYYY-MM-DD'), // Optional as per example where it might be part of equity.date
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
		.describe('List of markets (equity, option, bond, future, forex)'),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
		.optional()
		.describe('Date for market hours, YYYY-MM-DD. Defaults to current day.'),
})
export type GetMarketHoursRequestQueryParamsSchema = z.infer<
	typeof GetMarketHoursRequestQueryParamsSchema
>

// Schema for Response Body of GET /markets
// The response is an object where keys are the market names queried (e.g., "equity", "option")
// and values are the market hours data.
export const GetMarketHoursResponseBodySchema = z.record(
	MarketHoursMarketQueryEnum, // Keys like "equity", "option"
	MarketHoursDataSchema,
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
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
		.optional()
		.describe('Date for market hours, YYYY-MM-DD. Defaults to current day.'),
})
export type GetMarketHoursByMarketIdRequestQueryParamsSchema = z.infer<
	typeof GetMarketHoursByMarketIdRequestQueryParamsSchema
>

// Response Body Schema for GET /markets/{market_id}
// This endpoint returns the MarketHoursDataSchema directly for the specified market.
export const GetMarketHoursByMarketIdResponseBodySchema = MarketHoursDataSchema
export type GetMarketHoursByMarketIdResponseBodySchema = z.infer<
	typeof GetMarketHoursByMarketIdResponseBodySchema
>
