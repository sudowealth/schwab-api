import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetInstrumentsQueryParams,
	GetInstrumentsResponse,
	GetInstrumentByCusipPathParams,
	GetInstrumentByCusipResponse,
} from './schema'

export const getInstrumentsMeta: EndpointMetadata<
	never, // No Path Params
	GetInstrumentsQueryParams, // Query Params
	never, // No Request Body
	GetInstrumentsResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.INSTRUMENTS.GET_INSTRUMENTS,
	querySchema: GetInstrumentsQueryParams,
	responseSchema: GetInstrumentsResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get Instruments by symbols and projections.',
}

export const getInstrumentByCusipMeta: EndpointMetadata<
	GetInstrumentByCusipPathParams, // Path Params
	never, // No Query Params
	never, // No Request Body
	GetInstrumentByCusipResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.INSTRUMENTS.GET_INSTRUMENT,
	pathSchema: GetInstrumentByCusipPathParams,
	responseSchema: GetInstrumentByCusipResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get Instrument by CUSIP.',
}
