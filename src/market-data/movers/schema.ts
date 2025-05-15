import { z } from 'zod'

// Enum for symbolId path parameter
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
	.enum(['0', '1', '5', '10', '30', '60'])
	.transform(Number)
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
	change: z
		.number()
		.describe('percent or value changed, by default its percent changed'),
	direction: MoversDirectionEnum.describe('Enum: [ up, down ]'),
	last: z.number().describe('what was last quoted price'),
	symbol: z.string().describe('schwab security symbol'),
	totalVolume: z.number().int().describe('integer($int64)'),
})
export type ScreenerSchema = z.infer<typeof ScreenerSchema>

// Schema for Request Path Parameters of GET /movers/:symbolId
export const GetMoversRequestPathParamsSchema = z.object({
	symbolId: MoversSymbolIdEnum.describe('Index Symbol'),
})
export type GetMoversRequestPathParamsSchema = z.infer<
	typeof GetMoversRequestPathParamsSchema
>

// Schema for Request Query Parameters of GET /movers/:symbolId
export const GetMoversRequestQueryParamsSchema = z.object({
	sort: MoversSortEnum.optional().describe('Sort by a particular attribute'),
	frequency: MoversFrequencyEnum.optional()
		.default('0') // Default value '0' (string) before transform
		.describe('To return movers with the specified directions of up or down'),
})
export type GetMoversRequestQueryParamsSchema = z.infer<
	typeof GetMoversRequestQueryParamsSchema
>

// Schema for Response Body of GET /movers/:symbolId
export const GetMoversResponseBodySchema = z.object({
	screeners: z.array(ScreenerSchema),
})
export type GetMoversResponseBodySchema = z.infer<
	typeof GetMoversResponseBodySchema
>
