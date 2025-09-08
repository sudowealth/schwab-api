export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type getInstrumentByCusipMeta,
	type getInstrumentsMeta,
} from './endpoints.js'

export type GetInstrumentsFunction = EndpointFunction<typeof getInstrumentsMeta>
export declare const getInstruments: GetInstrumentsFunction

export type GetInstrumentByCusipFunction = EndpointFunction<
	typeof getInstrumentByCusipMeta
>
export declare const getInstrumentByCusip: GetInstrumentByCusipFunction
