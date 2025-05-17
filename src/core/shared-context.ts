/**
 * Shared context utility
 *
 * This module provides a single shared RequestContext instance
 * to be used across all endpoints in the application.
 *
 * Benefits:
 * - Ensures consistent environment, timeout, and logging configs
 * - Reduces duplication of context creation across endpoint files
 * - Maintains a single instance for performance and consistency
 */

import { createApiClient } from '../create-api-client'
import { type RequestContext } from './http'

// Singleton instance of the shared context
let _sharedContext: RequestContext | null = null

/**
 * Returns the shared request context
 *
 * Use this function to get a consistent context across all endpoint files
 * instead of creating new contexts with createRequestContext()
 *
 * @returns A shared RequestContext instance
 */
export function getSharedContext(): RequestContext {
	// Lazily initialize the shared context on first use
	if (!_sharedContext) {
		// Create a default API client and extract its context
		_sharedContext = createApiClient()._context
	}

	return _sharedContext
}
