import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetOptionChainQueryParams,
	GetOptionChainResponse,
	GetOptionExpirationChainQueryParams,
	GetOptionExpirationChainResponse,
} from './schema'

export const getOptionChainMeta: EndpointMetadata<
	never, // No Path Params
	GetOptionChainQueryParams, // Query Params
	never, // No Request Body
	GetOptionChainResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.OPTIONS.GET_OPTION_CHAIN,
	querySchema: GetOptionChainQueryParams,
	responseSchema: GetOptionChainResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get option chain for an optionable symbol.',
}

export const getOptionExpirationChainMeta: EndpointMetadata<
	never, // No Path Params
	GetOptionExpirationChainQueryParams, // Query Params
	never, // No Request Body
	GetOptionExpirationChainResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.OPTIONS.GET_OPTION_EXPIRATION_CHAIN,
	querySchema: GetOptionExpirationChainQueryParams,
	responseSchema: GetOptionExpirationChainResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get option expiration chain for an optionable symbol.',
}
