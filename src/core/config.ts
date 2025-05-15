import {
	API_URLS,
	type API_VERSIONS,
	type ENVIRONMENTS,
	TIMEOUTS,
} from '../constants'

type ApiVersion = keyof typeof API_VERSIONS
type Environment = keyof typeof ENVIRONMENTS
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
	environment: Environment

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
