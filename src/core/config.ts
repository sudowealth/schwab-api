import {
	API_URLS,
	type API_VERSIONS,
	TIMEOUTS,
	type ENVIRONMENTS,
} from '../constants'

type ApiVersion = keyof typeof API_VERSIONS
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'

/**
 * Logger interface that can be implemented by consuming applications
 */
export interface SchwabApiLogger {
	debug: (message: string, ...args: any[]) => void
	info: (message: string, ...args: any[]) => void
	warn: (message: string, ...args: any[]) => void
	error: (message: string, ...args: any[]) => void
}

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

	/**
	 * Custom logger implementation
	 * If not provided, a default console logger will be used
	 * @default undefined
	 */
	logger?: SchwabApiLogger
}

/**
 * Default console logger implementation
 */
const DEFAULT_CONSOLE_LOGGER: SchwabApiLogger = {
	debug: (message: string, ...args: any[]) => console.debug(message, ...args),
	info: (message: string, ...args: any[]) => console.info(message, ...args),
	warn: (message: string, ...args: any[]) => console.warn(message, ...args),
	error: (message: string, ...args: any[]) => console.error(message, ...args),
}

// Default API configuration
const DEFAULT_API_CONFIG: SchwabApiConfig = {
	baseUrl: API_URLS.PRODUCTION,
	environment: 'PRODUCTION',
	enableLogging: false,
	logLevel: 'info',
	apiVersion: 'v1',
	timeout: TIMEOUTS.DEFAULT_REQUEST,
	// Default logger not set here, will be added in getSchwabApiConfigDefaults
}

/**
 * Get a copy of the default API configuration
 */
export function getSchwabApiConfigDefaults(): SchwabApiConfig {
	return {
		...DEFAULT_API_CONFIG,
		// Add default logger if enableLogging is true
		logger: DEFAULT_CONSOLE_LOGGER,
	}
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
