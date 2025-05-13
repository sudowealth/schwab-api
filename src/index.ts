// Public surface of the schwab-api-client package
export * from "./core"; // Exports configureSchwabApi, SchwabApiError, isSchwabApiError, createEndpoint etc.
export * as auth from "./auth"; // Exports auth helpers like buildAuthorizeUrl, exchangeCodeForToken
export * as trader from "./trader"; // Exports trader resources like accounts, orders
export * as marketData from "./market-data"; // Placeholder for market data
export * as schemas from "./schemas"; // NEW: Export shared schemas (enums, etc.)

// It might also be useful to re-export specific high-level functions or types directly
// e.g., export type { SchwabApiConfig } from './core';
// However, the `export *` pattern is common for SDKs.
