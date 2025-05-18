export * from './schema'
export * from './endpoints'

import { type EndpointFunction } from '../../core/endpoint-types'
import { type getUserPreferenceMeta } from './endpoints'

export type GetUserPreferenceFunction = EndpointFunction<typeof getUserPreferenceMeta>
export declare const getUserPreference: GetUserPreferenceFunction