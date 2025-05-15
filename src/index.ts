// Public surface of the schwab-api package
export * from './core'
export * as auth from './auth'
export * as marketData from './market-data'
export * as trader from './trader'
export * as schemas from './schemas'
export {
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
} from './core/errors'

// OAuth Helper exports
export { createAuthClient } from './auth/auth-client'

// Request Pipeline exports
export { configureSchwabApi } from './configure-api'
export { withAuth } from './middleware/with-auth'
export { withRateLimit } from './middleware/with-rate-limit'
export { withRetry } from './middleware/with-retry'
