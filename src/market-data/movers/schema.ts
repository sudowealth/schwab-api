import { z } from 'zod/v4'

// Enum for symbol_id path parameter
export const MoversSymbolIdEnum = z.enum([
	'$DJI',
	'$COMPX',
	'$SPX',
	'NYSE',
	'NASDAQ',
	'OTCBB',
	'INDEX_ALL',
	'EQUITY_ALL',
	'OPTION_ALL',
	'OPTION_PUT',
	'OPTION_CALL',
])
export type MoversSymbolIdEnum = z.infer<typeof MoversSymbolIdEnum>

// Enum for sort query parameter
export const MoversSortEnum = z.enum([
	'VOLUME',
	'TRADES',
	'PERCENT_CHANGE_UP',
	'PERCENT_CHANGE_DOWN',
])
export type MoversSortEnum = z.infer<typeof MoversSortEnum>

// Enum for frequency query parameter (numeric values)
export const MoversFrequencyEnum = z
	.union([
		z.literal(0),
		z.literal(1),
		z.literal(5),
		z.literal(10),
		z.literal(30),
		z.literal(60),
	])
	.or(z.coerce.number().refine((val) => [0, 1, 5, 10, 30, 60].includes(val)))
export type MoversFrequencyEnum = z.infer<typeof MoversFrequencyEnum>

// Enum for direction field in ScreenerSchema
export const MoversDirectionEnum = z.enum(['up', 'down'])
export type MoversDirectionEnum = z.infer<typeof MoversDirectionEnum>

// Schema for a single Screener item in the response
export const ScreenerSchema = z.object({
	description: z
		.string()
		.optional()
		.describe('Security info of most moved with in an index'), // Description in screenshot is for screener, making field optional
	netChange: z
		.number()
		.describe('percent or value changed, by default its percent changed'),
	direction: MoversDirectionEnum.optional().describe('Enum: [ up, down ]'), // Made optional as it's not in the provided response
	lastPrice: z.number().describe('what was last quoted price'),
	symbol: z.string().describe('schwab security symbol'),
	totalVolume: z.number().int().describe('integer($int64)'),
	// Added fields from the actual response
	volume: z.number().int().describe('Volume for the individual symbol'),
	marketShare: z.number().describe('Market share of the symbol'),
	trades: z.number().int().describe('Number of trades for the symbol'),
	netPercentChange: z.number().describe('Net percent change for the symbol'),
})
export type ScreenerSchema = z.infer<typeof ScreenerSchema>

// Path Parameters Schema
export const GetMoversPathParams = z.object({
	symbol_id: z
		.string()
		.describe(
			'The index symbol to get movers from. Supported index symbols: $DJI, $COMPX, $SPX',
		),
})
export type GetMoversPathParams = z.infer<typeof GetMoversPathParams>

// Query Parameters Schema
export const GetMoversQueryParams = z.object({
	sort: MoversDirectionEnum.describe(
		'Direction of the sort. Available values: up, down',
	),
	frequency: z
		.number()
		.int()
		.default(0)
		.optional()
		.describe(
			'Frequency of the data. 0 = real-time, 1 = 1 minute delayed, 5 = 5 minute delayed',
		),
})
export type GetMoversQueryParams = z.infer<typeof GetMoversQueryParams>

// Response Body Schema
export const GetMoversResponse = z.object({
	screeners: z.array(ScreenerSchema),
})
export type GetMoversResponse = z.infer<typeof GetMoversResponse>

// Request Params Schema for GET /movers/{symbol_id} (merged path + query params)
export const GetMoversParams = GetMoversPathParams.extend(
	GetMoversQueryParams.shape,
)
export type GetMoversParams = z.infer<typeof GetMoversParams>
