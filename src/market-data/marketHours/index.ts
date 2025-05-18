export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type GetMarketHoursResponseBodySchema, type GetMarketHoursByMarketIdResponseBodySchema } from './schema'

export type GetMarketHoursFunction = (params: { markets: string; date?: string }) => Promise<GetMarketHoursResponseBodySchema>
export declare const getMarketHours: GetMarketHoursFunction

export type GetMarketHoursByMarketIdFunction = (params: { market_id: string; date?: string }) => Promise<GetMarketHoursByMarketIdResponseBodySchema>
export declare const getMarketHoursByMarketId: GetMarketHoursByMarketIdFunction