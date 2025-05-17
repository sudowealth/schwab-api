import {
	API_URLS,
	type API_VERSIONS,
	TIMEOUTS,
	type ENVIRONMENTS,
} from '../constants'

type ApiVersion = keyof typeof API_VERSIONS
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'

export interface SchwabApiConfig {
	/**
	 * Base URL for API requests
	 * @default API_URLS.PRODUCTION
	 */
	baseUrl: string

	/**
	 * API environment
	 * @default ENVIRONMENTS.PRODUCTION
	 */
	environment: keyof typeof ENVIRONMENTS

	/**
	 * Enable logging for API requests and responses
	 * @default false
	 */
	enableLogging: boolean

	/**
	 * Log level for API requests and responses
	 * @default 'info'
	 */
	logLevel: LogLevel

	/**
	 * API version to use
	 * @default API_VERSIONS.V1
	 */
	apiVersion: ApiVersion

	/**
	 * Timeout for API requests in milliseconds
	 * @default TIMEOUTS.DEFAULT_REQUEST
	 */
	timeout: number
}

// Default API configuration
const DEFAULT_API_CONFIG: SchwabApiConfig = {
	baseUrl: API_URLS.PRODUCTION,
	environment: 'PRODUCTION',
	enableLogging: false,
	logLevel: 'info',
	apiVersion: 'v1',
	timeout: TIMEOUTS.DEFAULT_REQUEST,
}

/**
 * Get a copy of the default API configuration
 */
export function getSchwabApiConfigDefaults(): SchwabApiConfig {
	return { ...DEFAULT_API_CONFIG }
}

/**
 * Resolves the environment configuration to determine the appropriate base URL
 * This is the central function for environment/URL resolution
 *
 * @param config The configuration to resolve
 * @returns The resolved base URL
 */
export function resolveBaseUrl(config: Partial<SchwabApiConfig> = {}): string {
	// If a custom baseUrl is provided, use it regardless of environment
	if (config.baseUrl) {
		return config.baseUrl
	}

	// Otherwise, derive the baseUrl from the environment
	const environment = config.environment || DEFAULT_API_CONFIG.environment
	return environment === 'PRODUCTION' ? API_URLS.PRODUCTION : API_URLS.SANDBOX
}
