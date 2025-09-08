export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import { type getPriceHistoryMeta } from './endpoints.js'

export type GetPriceHistoryFunction = EndpointFunction<
	typeof getPriceHistoryMeta
>
export declare const getPriceHistory: GetPriceHistoryFunction
