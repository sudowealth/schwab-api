export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import { type getPriceHistoryMeta } from './endpoints'

export type GetPriceHistoryFunction = EndpointFunction<
	typeof getPriceHistoryMeta
>
export declare const getPriceHistory: GetPriceHistoryFunction
