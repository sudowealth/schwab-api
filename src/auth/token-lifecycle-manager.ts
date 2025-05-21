import { SchwabAuthError, AuthErrorCode } from '../errors'
import {
	type TokenData,
	type ITokenLifecycleManager,
	type RefreshOptions,
} from './types'

/**
 * Function to determine if an object implements ITokenLifecycleManager
 * @param obj Object to check
 * @returns True if the object implements ITokenLifecycleManager
 */
export function isTokenLifecycleManager(
	obj: unknown,
): obj is ITokenLifecycleManager {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'getTokenData' in obj &&
		'getAccessToken' in obj &&
		'supportsRefresh' in obj &&
		typeof (obj as any).getTokenData === 'function' &&
		typeof (obj as any).getAccessToken === 'function' &&
		typeof (obj as any).supportsRefresh === 'function'
	)
}

/**
 * Forcibly refreshes the tokens managed by a token lifecycle manager.
 * This is useful when you need to explicitly trigger a refresh regardless of token expiration.
 *
 * @param manager The token lifecycle manager to refresh tokens for
 * @param options Optional refresh options
 * @returns The refreshed token data
 * @throws Error if the manager doesn't support refresh
 */
export async function forceRefreshTokens(
	manager: ITokenLifecycleManager,
	options?: RefreshOptions,
): Promise<TokenData> {
	// Validate that manager supports refresh
	if (!manager.supportsRefresh() || !manager.refreshIfNeeded) {
		throw new SchwabAuthError(
			AuthErrorCode.UNKNOWN,
			'This token manager does not support refresh operations',
			undefined,
			{ manager: manager.constructor.name },
		)
	}

	// Force refresh by setting force flag to true
	return manager.refreshIfNeeded({
		...options,
		force: true,
	})
}

// Re-export types from the types module for convenience
export type { TokenData, ITokenLifecycleManager }
