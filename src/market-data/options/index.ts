export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import { type getOptionChainMeta, type getOptionExpirationChainMeta } from './endpoints'

export type GetOptionChainFunction = EndpointFunction<typeof getOptionChainMeta>
export declare const getOptionChain: GetOptionChainFunction

export type GetOptionExpirationChainFunction = EndpointFunction<typeof getOptionExpirationChainMeta>
export declare const getOptionExpirationChain: GetOptionExpirationChainFunction
