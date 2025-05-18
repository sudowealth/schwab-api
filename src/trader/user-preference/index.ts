export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type GetUserPreferenceResponseBody } from './schema'

export type GetUserPreferenceFunction = () => Promise<GetUserPreferenceResponseBody>
export declare const getUserPreference: GetUserPreferenceFunction