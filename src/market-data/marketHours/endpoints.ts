import { MARKET_DATA } from '../../constants.js'
import { type EndpointMetadata } from '../../core/http.js'
import { ErrorResponseSchema } from '../../errors.js'
import {
	GetMarketHoursQueryParams,
	GetMarketHoursResponse,
	GetMarketHoursByMarketIdPathParams,
	GetMarketHoursByMarketIdQueryParams,
	GetMarketHoursByMarketIdResponse,
} from './schema.js'

export const getMarketHoursMeta: EndpointMetadata<
	never, // No Path Params
	GetMarketHoursQueryParams, // Query Params
	never, // No Request Body
	GetMarketHoursResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_MULTIPLE_MARKETS,
	querySchema: GetMarketHoursQueryParams,
	responseSchema: GetMarketHoursResponse,
	errorSchema: ErrorResponseSchema,
	description:
		'Get Market Hours for dates in the future across different markets.',
}

export const getMarketHoursByMarketIdMeta: EndpointMetadata<
	GetMarketHoursByMarketIdPathParams, // Path Params
	GetMarketHoursByMarketIdQueryParams, // Query Params
	never, // No Request Body
	GetMarketHoursByMarketIdResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_SINGLE_MARKET,
	pathSchema: GetMarketHoursByMarketIdPathParams,
	querySchema: GetMarketHoursByMarketIdQueryParams,
	responseSchema: GetMarketHoursByMarketIdResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get Market Hours for dates in the future for a single market.',
}
