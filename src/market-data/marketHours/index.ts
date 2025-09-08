export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type getMarketHoursByMarketIdMeta,
	type getMarketHoursMeta,
} from './endpoints.js'

export type GetMarketHoursFunction = EndpointFunction<typeof getMarketHoursMeta>
export declare const getMarketHours: GetMarketHoursFunction

export type GetMarketHoursByMarketIdFunction = EndpointFunction<
	typeof getMarketHoursByMarketIdMeta
>
export declare const getMarketHoursByMarketId: GetMarketHoursByMarketIdFunction
