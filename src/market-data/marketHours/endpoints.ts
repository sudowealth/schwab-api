import { createEndpoint } from '../../core/http'
import {
	GetMarketHoursRequestQueryParamsSchema,
	GetMarketHoursResponseBodySchema,
	GetMarketHoursByMarketIdRequestPathParamsSchema,
	GetMarketHoursByMarketIdRequestQueryParamsSchema,
	GetMarketHoursByMarketIdResponseBodySchema,
} from './schema'

export const getMarketHours = createEndpoint<
	never, // No Path Params
	GetMarketHoursRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type (can be refined if specific error schemas exist)
>({
	method: 'GET',
	path: '/marketdata/v1/markets', // As per the screenshot
	querySchema: GetMarketHoursRequestQueryParamsSchema,
	responseSchema: GetMarketHoursResponseBodySchema,
	description: 'Get Market Hours for different markets.',
})

export const getMarketHoursByMarketId = createEndpoint<
	GetMarketHoursByMarketIdRequestPathParamsSchema, // Path Params
	GetMarketHoursByMarketIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursByMarketIdResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/marketdata/v1/markets/:market_id', // Path with market_id parameter
	pathSchema: GetMarketHoursByMarketIdRequestPathParamsSchema,
	querySchema: GetMarketHoursByMarketIdRequestQueryParamsSchema,
	responseSchema: GetMarketHoursByMarketIdResponseBodySchema,
	description: 'Get Market Hours for a single market.',
})
