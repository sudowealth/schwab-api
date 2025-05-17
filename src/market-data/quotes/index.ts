export * from './schema'
export * from './endpoints'

/**
 * Extracts and aggregates quote errors from a GetQuotesResponseBody
 *
 * When using the quotes endpoints, it's possible to get a successful HTTP 200 response
 * that contains a mix of valid quotes and per-symbol errors. This function helps identify
 * and extract those symbol-level errors for easier processing.
 *
 * @param responseBody - The response body from getQuotes or getQuoteBySymbolId
 * @returns An object with information about the errors, including:
 *   - hasErrors: Boolean indicating if any symbols had errors
 *   - errorCount: Total number of symbols with errors
 *   - symbolErrors: Map of symbol to error information
 *   - invalidSymbols: List of symbols marked as invalid
 *   - invalidCusips: List of CUSIPs marked as invalid
 *   - invalidSSIDs: List of SSIDs marked as invalid
 */
export function extractQuoteErrors(responseBody: Record<string, any>) {
	const result = {
		hasErrors: false,
		errorCount: 0,
		symbolErrors: {} as Record<string, any>,
		invalidSymbols: [] as string[],
		invalidCusips: [] as string[],
		invalidSSIDs: [] as number[],
	}

	// Early return if response is empty
	if (!responseBody || typeof responseBody !== 'object') {
		return result
	}

	// Check each symbol in the response
	for (const [symbol, data] of Object.entries(responseBody)) {
		// Check if this entry is an error (lacks assetType but might have error properties)
		// We're using a simple heuristic: if it has description, invalidSymbols, etc. but no assetType
		if (data && typeof data === 'object' && !('assetType' in data)) {
			// This appears to be an error entry
			result.hasErrors = true
			result.errorCount++
			result.symbolErrors[symbol] = data

			// Collect specific error details if available
			if ('invalidSymbols' in data && Array.isArray(data.invalidSymbols)) {
				result.invalidSymbols.push(...data.invalidSymbols)
			}
			if ('invalidCusips' in data && Array.isArray(data.invalidCusips)) {
				result.invalidCusips.push(...data.invalidCusips)
			}
			if ('invalidSSIDs' in data && Array.isArray(data.invalidSSIDs)) {
				result.invalidSSIDs.push(...data.invalidSSIDs)
			}
		}
	}

	return result
}

/**
 * Checks if a specific symbol has an error in the quotes response
 *
 * @param responseBody - The response body from getQuotes or getQuoteBySymbolId
 * @param symbol - The symbol to check for errors
 * @returns True if the symbol has an error, false if it has valid quote data or isn't in the response
 */
export function hasSymbolError(
	responseBody: Record<string, any>,
	symbol: string,
): boolean {
	if (
		!responseBody ||
		typeof responseBody !== 'object' ||
		!(symbol in responseBody)
	) {
		return false
	}

	const data = responseBody[symbol]
	// Check if this entry is an error (lacks assetType but has error-related properties)
	return data && typeof data === 'object' && !('assetType' in data)
}
