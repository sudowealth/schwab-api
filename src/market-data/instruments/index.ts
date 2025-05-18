export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type InstrumentsResponseSchema, type GetInstrumentByCusipResponseBodySchema } from './schema'

export type GetInstrumentsFunction = (params: { symbols: string; projection?: string }) => Promise<InstrumentsResponseSchema>
export declare const getInstruments: GetInstrumentsFunction

export type GetInstrumentByCusipFunction = (params: { cusip_id: string }) => Promise<GetInstrumentByCusipResponseBodySchema>
export declare const getInstrumentByCusip: GetInstrumentByCusipFunction