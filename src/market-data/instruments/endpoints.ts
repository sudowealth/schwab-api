import { createEndpoint } from '../../core/http' // Corrected path to core
import {
	GetInstrumentsRequestQueryParamsSchema,
	InstrumentsResponseSchema,
	GetInstrumentByCusipRequestPathParamsSchema,
	GetInstrumentByCusipResponseBodySchema,
} from './schema'

export const getInstruments = createEndpoint<
	never, // No Path Params
	GetInstrumentsRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	InstrumentsResponseSchema, // Response Body
	'GET', // HTTP Method
	any // Error type (can be refined if specific error schemas exist)
>({
	method: 'GET',
	path: '/market-data/v1/instruments', // As per the screenshot
	querySchema: GetInstrumentsRequestQueryParamsSchema,
	responseSchema: InstrumentsResponseSchema,
	description: 'Get Instruments by symbols and projections.',
})

export const getInstrumentByCusip = createEndpoint<
	GetInstrumentByCusipRequestPathParamsSchema, // Path Params
	never, // No Query Params
	never, // No Request Body
	GetInstrumentByCusipResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/market-data/v1/instruments/:cusip_id', // Path with parameter
	pathSchema: GetInstrumentByCusipRequestPathParamsSchema,
	responseSchema: GetInstrumentByCusipResponseBodySchema,
	description: 'Get Instrument by specific cusip.',
})
