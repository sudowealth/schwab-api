// Re-export all trader resources
export * as accounts from './accounts';
export * as orders from './orders';
export * as transactions from './transactions';
export * as userPreference from './user-preference';

// Potentially also re-export schemas if they are intended for public consumption directly
// export * as accountSchemas from './accounts/schema';
// export * as orderSchemas from './orders/schema';
// etc.
// For now, following the plan to keep schemas local to each resource's endpoints. 

// Shared schemas are available via the top-level 'schemas' export from src/index.ts 