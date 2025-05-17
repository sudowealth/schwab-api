# Error Handling and Debugging

The Schwab API client provides a comprehensive error handling system that is
designed to make troubleshooting in production environments easier. This
document outlines the key error handling features and how to use them in your
application.

## Error Hierarchy

All errors thrown by the Schwab API client extend from the base `SchwabError`
class, providing a consistent error hierarchy:

```
SchwabError
├── SchwabAuthError (authentication errors)
└── SchwabApiError (API request errors)
    ├── ClientApiError (client errors - HTTP 4xx)
    │   └── SchwabAuthorizationError (HTTP 401)
    ├── RetryableApiError (retryable errors)
    │   ├── SchwabRateLimitError (HTTP 429)
    │   ├── SchwabServerError (HTTP 500/502/503/504)
    │   ├── SchwabNetworkError (network failures)
    │   └── SchwabTimeoutError (request timeouts)
    └── Generic SchwabApiError instances (other status codes)
```

This hierarchy allows for precise error handling based on error type:

```typescript
import {
	isRateLimitError,
	isNetworkError,
	isClientError,
	hasNotFoundStatus,
} from '@sudowealth/schwab-api'

try {
	const data = await client.marketData.quotes.getQuotes(['AAPL', 'MSFT'])
} catch (error) {
	if (isRateLimitError(error)) {
		console.log('Rate limit exceeded, try again later')
	} else if (isNetworkError(error)) {
		console.log('Network connectivity issue detected')
	} else if (isClientError(error, 403)) {
		console.log('Forbidden - check permissions')
	} else if (hasNotFoundStatus(error)) {
		console.log('Resource not found')
	} else {
		console.error('Unexpected error:', error)
	}
}
```

## Error Type Guards and Status Checking

The SDK provides two main ways to check for specific error types:

1. **Class-based type guards** (check the error's instance type):

   ```typescript
   if (isServerError(error)) {
   	// Handle any server error (500, 502, 503, 504)
   }
   ```

2. **Status-based checks** (check the error's HTTP status code):

   ```typescript
   if (isClientError(error, 404)) {
   	// Handle 404 Not Found specifically
   }

   if (hasNotFoundStatus(error)) {
   	// Alternate way to check for 404 status
   }

   if (isServerErrorWithAnyStatus(error, [502, 504])) {
   	// Handle gateway errors specifically
   }
   ```

The status-based approach is generally more flexible as it allows for precise
error handling without needing to rely on specific error subclasses.

## Error Context and Debugging

All API errors include rich metadata to help with debugging, especially in
production environments where reproducing issues can be challenging.

### Request IDs

Every API error can include a request ID that uniquely identifies the request in
Schwab's systems. This is crucial for working with Schwab support to
troubleshoot issues.

```typescript
try {
	await client.trader.orders.placeOrder(/* ... */)
} catch (error) {
	if (error.getRequestId) {
		console.error(`Request ID: ${error.getRequestId()}`)
	}
	throw error
}
```

### Debugging Context

API errors include method-level debug information that consolidates key
debugging details:

```typescript
try {
	await client.trader.accounts.getAccounts()
} catch (error) {
	// Get all debugging context in a single string
	console.error(`Error context: ${error.getDebugContext()}`)

	// Output example:
	// "Error context: Request ID: 123e4567-e89b-12d3-a456-426614174000 | Endpoint: GET /v1/accounts | Time: 2023-07-01T12:34:56.789Z"
}
```

### Rich Error Metadata

Error objects capture additional metadata from response headers:

```typescript
try {
	await client.marketData.quotes.getQuotes(['AAPL', 'MSFT', 'GOOG'])
} catch (error) {
	if (error.metadata) {
		// Full error context
		console.log('Error occurred with:')
		console.log(`- Request ID: ${error.metadata.requestId}`)
		console.log(
			`- Endpoint: ${error.metadata.requestMethod} ${error.metadata.endpointPath}`,
		)
		console.log(`- Timestamp: ${error.metadata.timestamp?.toISOString()}`)

		// Rate limit information if available
		if (error.metadata.rateLimit) {
			console.log('Rate limit details:')
			console.log(`- Limit: ${error.metadata.rateLimit.limit}`)
			console.log(`- Remaining: ${error.metadata.rateLimit.remaining}`)
			console.log(
				`- Reset: ${new Date(error.metadata.rateLimit.reset! * 1000).toISOString()}`,
			)
		}

		// Retry guidance if available
		if (error.metadata.retryAfterSeconds) {
			console.log(`Retry after: ${error.metadata.retryAfterSeconds} seconds`)
		}
	}
}
```

## Retryable Errors

All error classes include an `isRetryable()` method that indicates whether the
error can be retried:

```typescript
try {
	await makeApiCall()
} catch (error) {
	if (error.isRetryable && error.isRetryable()) {
		// This error can be retried
		console.log('This error is retryable')
	} else {
		console.log('This error cannot be retried')
	}
}
```

The retry middleware uses this method to automatically retry appropriate errors.

## Working with Error Responses

When the API returns structured error responses, they are parsed and available
in the error object:

```typescript
try {
	await client.trader.orders.placeOrder(/* ... */)
} catch (error) {
	if (error.parsedError?.errors) {
		// Process structured error information
		for (const err of error.parsedError.errors) {
			console.log(`${err.title}: ${err.detail}`)
			if (err.source?.parameter) {
				console.log(`Invalid parameter: ${err.source.parameter}`)
			}
		}
	}

	// Get a formatted summary of all error details
	if (error.getFormattedDetails) {
		console.log(error.getFormattedDetails())
	}
}
```

## Error Categorization

The API client provides utility functions for categorizing errors:

```typescript
import { getErrorCategory, getErrorStatusCode } from '@sudowealth/schwab-api'

try {
	await makeApiCall()
} catch (error) {
	// Get an error category string for logging and metrics
	const category = getErrorCategory(error)

	// Get the HTTP status code (or 0 if not an API error)
	const statusCode = getErrorStatusCode(error)

	console.log(`Error category: ${category}, status code: ${statusCode}`)
}
```

## Creating Errors for Testing and Custom Handling

When you need to create errors for testing or custom error handling, use the
factory functions provided by the SDK:

```typescript
// Recommended: Use the central factory function
import { createSchwabApiError } from '@sudowealth/schwab-api'

// Create a 404 Not Found error
const notFoundError = createSchwabApiError(
	404,
	{ message: 'Resource not found' },
	'Custom message for not found scenario',
)

// Create a rate limit error
const rateLimitError = createSchwabApiError(
	429,
	{ message: 'Rate limit exceeded' },
	'Too many requests',
)

// Create a server error
const serverError = createSchwabApiError(
	500,
	{ message: 'Internal server error' },
	'Service unavailable due to maintenance',
)
```

The factory function will automatically instantiate the appropriate error class
based on the status code, ensuring consistent error creation throughout the
codebase.

## Handling Partial Success Patterns

Some endpoints support a "partial success" pattern, where a request returns a
successful HTTP 200 response but includes errors for specific items in the
response. This is different from the standard error handling pattern where
failed requests throw `SchwabApiError`.

### Quotes Endpoint Partial Success

The most notable example is the market data quotes endpoint, which can return a
mix of valid quotes and error objects for individual symbols:

```typescript
const response = await client.marketData.quotes.getQuotes({
	queryParams: {
		symbols: ['AAPL', 'MSFT', 'INVALID', 'XYZ123'],
	},
})

// The response will be a map of symbols to either valid quotes or error objects:
// {
//   "AAPL": { assetType: "EQUITY", symbol: "AAPL", ... },
//   "MSFT": { assetType: "EQUITY", symbol: "MSFT", ... },
//   "INVALID": { description: "Symbol not found", invalidSymbols: ["INVALID"] },
//   "XYZ123": { description: "Security does not exist", invalidSymbols: ["XYZ123"] }
// }
```

The client provides utilities to help handle this pattern gracefully:

1. **Extract all errors**:

```typescript
const errorInfo = client.marketData.quotes.extractQuoteErrors(response)

if (errorInfo.hasErrors) {
	console.log(`${errorInfo.errorCount} symbols returned errors`)
	console.log('Invalid symbols:', errorInfo.invalidSymbols)

	// Process each error in detail
	for (const [symbol, errorData] of Object.entries(errorInfo.symbolErrors)) {
		console.log(`Error for ${symbol}: ${errorData.description}`)
	}
}
```

2. **Check individual symbols**:

```typescript
// Determine if a specific symbol has an error
if (client.marketData.quotes.hasSymbolError(response, 'AAPL')) {
	console.log('AAPL returned an error')
} else {
	const appleData = response['AAPL']
	console.log('AAPL quote:', appleData.mark || appleData.lastPrice)
}
```

This approach allows your application to gracefully handle partial failures
while still processing the valid data returned by the endpoint.

### Benefits of Partial Success Handling

1. **Improved user experience** - You can still show valid data while explaining
   which items failed
2. **Reduced request overhead** - No need to make separate requests for each
   item to isolate failures
3. **Better error context** - Each individual error contains specific details
   about why that item failed

## Best Practices

1. **Always log request IDs** - These are essential for troubleshooting with
   Schwab support
2. **Use status-based checks for granular error handling** -
   `isClientError(error, 404)`, `hasNotFoundStatus(error)` etc.
3. **Check retryability** - Use `error.isRetryable()` before implementing manual
   retries
4. **Include error context in logs** - `error.getDebugContext()` provides
   essential information
5. **Consider fallbacks for rate limits** - Handle rate limits gracefully with
   user feedback
6. **Handle partial success patterns** - For endpoints like quotes, use the
   provided utilities to extract and handle item-level errors
7. **Always use the factory function for creating errors** -
   `createSchwabApiError()` ensures consistent error creation across the
   codebase

By leveraging these error handling features, you can build applications that are
more resilient and easier to troubleshoot in production environments.
