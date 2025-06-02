/**
 * Utility functions and classes for the Schwab API
 */

// Date utilities
export * from './date-utils'

// Schema utilities
export * from './schema-utils'

// Secure logging
export {
	SecureLogger,
	createLogger,
	logger,
	type LogLevel,
	type LoggerConfig,
	// New exports
	sanitizeKeyForLog,
	sanitizeError,
	sanitizeTokenForLog,
} from './secure-logger'

// Account scrubbing utilities
export {
	buildAccountDisplayMap,
	scrubAccountIdentifiers,
	createAccountScrubber,
	AccountScrubber,
	type AccountDisplayMap,
	type AccountScrubberOptions,
} from './account-scrubber'

// Crypto utilities
export {
	createHmacKey,
	signData,
	verifySignature,
	toHex,
	fromHex,
	bufferToBase64,
	base64ToBuffer,
	constantTimeCompare,
	generateSecureRandomString,
	hashData,
	createTimedSignature,
	verifyTimedSignature,
	type SigningOptions,
	type KeyValidationOptions,
} from './crypto-utils'
