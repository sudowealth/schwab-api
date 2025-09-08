/**
 * Token storage adapters for various platforms
 *
 * These adapters implement the standard load/save interface
 * expected by EnhancedTokenManager
 */

export * from './cookie-token-store.js'
export * from './kv-token-store.js'

// Future adapters can be added here:
// export * from './redis-token-store'
// export * from './dynamodb-token-store'
// export * from './memory-token-store'
