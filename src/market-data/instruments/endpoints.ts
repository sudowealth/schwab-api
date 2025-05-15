import { MARKET_DATA } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
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
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.INSTRUMENTS.GET_INSTRUMENTS,
	querySchema: GetInstrumentsRequestQueryParamsSchema,
	responseSchema: InstrumentsResponseSchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Instruments by symbols and projections.',
})

export const getInstrumentByCusip = createEndpoint<
	GetInstrumentByCusipRequestPathParamsSchema, // Path Params
	never, // No Query Params
	never, // No Request Body
	GetInstrumentByCusipResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.INSTRUMENTS.GET_INSTRUMENT,
	pathSchema: GetInstrumentByCusipRequestPathParamsSchema,
	responseSchema: GetInstrumentByCusipResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Instrument by specific cusip.',
})
