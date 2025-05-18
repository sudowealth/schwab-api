export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import { type getMoversMeta } from './endpoints'

export type GetMoversFunction = EndpointFunction<typeof getMoversMeta>
export declare const getMovers: GetMoversFunction