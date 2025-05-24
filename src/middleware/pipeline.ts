import { type EnhancedTokenManager } from '../auth/enhanced-token-manager'
import { createLogger } from '../utils/secure-logger'
import { type Middleware } from './compose'
import { type RateLimitOptions } from './with-rate-limit'
import { type RetryOptions } from './with-retry'
import {
	type TokenAuthOptions,
	DEFAULT_TOKEN_AUTH_OPTIONS,
} from './with-token-auth'

const logger = createLogger('Pipeline')

/**
 * Configuration options for the middleware pipeline
 */
export interface MiddlewarePipelineOptions {
	/**
	 * Configuration for authentication middleware
	 * Only used if token is provided
	 */
	auth?: Omit<TokenAuthOptions, 'tokenManager'>

	/**
	 * Configuration for rate limit middleware
	 * Set to false to disable rate limiting
	 */
	rateLimit?: Partial<RateLimitOptions> | false

	/**
	 * Configuration for retry middleware
	 * Set to false to disable retry
	 */
	retry?: Partial<RetryOptions> | false

	/**
	 * List of middleware types to disable
	 * Example: ['rateLimit', 'retry']
	 */
	disable?: Array<'auth' | 'rateLimit' | 'retry'>

	/**
	 * Custom middleware to add at the end of the pipeline
	 * These will be executed in the order provided
	 */
	custom?: Middleware[]

	/**
	 * Custom middleware to add at the beginning of the pipeline
	 * These will be executed in the order provided
	 */
	before?: Middleware[]

	/**
	 * Custom middleware to add between specific middleware types
	 * Use this for more precise placement in the pipeline
	 */
	between?: {
		/**
		 * Middleware to add after auth and before rate limiting
		 */
		authAndRateLimit?: Middleware[]

		/**
		 * Middleware to add after rate limiting and before retry
		 */
		rateLimitAndRetry?: Middleware[]
	}
}

/**
 * Builds a middleware pipeline from the provided options and token
 *
 * @param options Pipeline configuration options
 * @param token Authentication token or token manager
 * @returns Array of middleware functions in execution order
 */
export function buildMiddlewarePipeline(
	options: MiddlewarePipelineOptions = {},
	tokenManagerInstance?: EnhancedTokenManager,
): Middleware[] {
	const { withTokenAuth } = require('./with-token-auth')
	const { withRateLimit } = require('./with-rate-limit')
	const { withRetry } = require('./with-retry')

	const pipeline: Middleware[] = []
	const disabled = options.disable || []

	if (options.before && options.before.length > 0) {
		pipeline.push(...options.before)
	}

	if (!disabled.includes('auth') && tokenManagerInstance) {
		const authOptions: TokenAuthOptions = {
			tokenManager: tokenManagerInstance, // Directly use the passed ETM instance
			advanced: {
				...DEFAULT_TOKEN_AUTH_OPTIONS.advanced,
				...options.auth?.advanced,
			},
		}
		pipeline.push(withTokenAuth(authOptions))
	} else if (
		!disabled.includes('auth') &&
		tokenManagerInstance === undefined &&
		options.auth !== undefined
	) {
		// This case handles if a string token was attempted to be passed via createApiClient options implicitly
		// Forcing sync, we cannot handle async setup of ETM from string here.
		logger.error(
			'[buildMiddlewarePipeline] Auth options provided but no ETM instance, and string token setup is async. Auth middleware will be skipped or this should throw.',
		)
		// Depending on strictness, you might throw here:
		// throw new Error("Synchronous buildMiddlewarePipeline requires an EnhancedTokenManager instance for auth; string token setup is async.");
	}

	if (
		options.between?.authAndRateLimit &&
		options.between.authAndRateLimit.length > 0
	) {
		pipeline.push(...options.between.authAndRateLimit)
	}

	// Add rate limit middleware if not disabled
	if (!disabled.includes('rateLimit') && options.rateLimit !== false) {
		pipeline.push(withRateLimit(options.rateLimit || undefined))
	}

	// Add middleware that goes between rate limit and retry
	if (
		options.between?.rateLimitAndRetry &&
		options.between.rateLimitAndRetry.length > 0
	) {
		pipeline.push(...options.between.rateLimitAndRetry)
	}

	// Add retry middleware if not disabled
	if (!disabled.includes('retry') && options.retry !== false) {
		pipeline.push(withRetry(options.retry || undefined))
	}

	// Add any custom middleware at the end
	if (options.custom && options.custom.length > 0) {
		pipeline.push(...options.custom)
	}

	return pipeline
}
