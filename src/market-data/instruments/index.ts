export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import { type getInstrumentByCusipMeta, type getInstrumentsMeta } from './endpoints'

export type GetInstrumentsFunction = EndpointFunction<typeof getInstrumentsMeta>
export declare const getInstruments: GetInstrumentsFunction

export type GetInstrumentByCusipFunction = EndpointFunction<typeof getInstrumentByCusipMeta>
export declare const getInstrumentByCusip: GetInstrumentByCusipFunction