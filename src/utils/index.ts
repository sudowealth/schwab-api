/**
 * Utility functions and classes for the Schwab API
 */

// Date utilities
export * from './date-utils.js'

// Schema utilities
export * from './schema-utils.js'

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
} from './secure-logger.js'

// Account scrubbing utilities
export {
	buildAccountDisplayMap,
	scrubAccountIdentifiers,
	createAccountScrubber,
	AccountScrubber,
	type AccountDisplayMap,
	type AccountScrubberOptions,
} from './account-scrubber.js'

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
} from './crypto-utils.js'
