export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import {
	type getMarketHoursByMarketIdMeta,
	type getMarketHoursMeta,
} from './endpoints'

export type GetMarketHoursFunction = EndpointFunction<typeof getMarketHoursMeta>
export declare const getMarketHours: GetMarketHoursFunction

export type GetMarketHoursByMarketIdFunction = EndpointFunction<
	typeof getMarketHoursByMarketIdMeta
>
export declare const getMarketHoursByMarketId: GetMarketHoursByMarketIdFunction
