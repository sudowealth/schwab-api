/**
 * @internal
 *
 * This file exports internal utilities that should not be exposed in the public API.
 * These utilities are meant for internal use within the library only.
 */

// Export internal HTTP utilities from core
export {
	createRequestContext,
	buildUrlWithContext,
	schwabFetchWithContext,
	createEndpointWithContext,
	globalFetch,
	type RequestContext,
	type HttpMethod,
	type EndpointMetadata,
	type SchwabFetchRequestOptions,
} from '../core/http'

// Export internal config utilities
export {
	type SchwabApiConfig,
	getSchwabApiConfigDefaults,
	resolveBaseUrl,
} from '../core/config'

// Export internal shared context utilities
export { getSharedContext } from '../core/shared-context'

// Export internal middleware utilities
export {
	getMetadata,
	cloneRequestWithMetadata,
	type MiddlewareMetadata,
} from '../middleware/middleware-metadata'

export {
	type MiddlewarePipelineOptions,
	buildMiddlewarePipeline,
} from '../middleware/pipeline'

// Re-export public types that are needed internally
export { type Middleware, compose } from '../middleware/compose'
