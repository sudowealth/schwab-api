export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import { type getMoversMeta } from './endpoints.js'

export type GetMoversFunction = EndpointFunction<typeof getMoversMeta>
export declare const getMovers: GetMoversFunction
