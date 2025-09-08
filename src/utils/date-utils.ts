import { z } from 'zod'

/**
 * SchawbDate utility type
 * This type can be used to represent a Schwab date in any of its forms
 */
type SchwabDate = Date | string | number

/**
 * Type of date representation to use
 */
export enum DateFormatType {
	/** JavaScript Date object */
	DATE_OBJECT = 'date_object',
	/** ISO 8601 string (e.g., "2023-10-15T14:30:00.000Z") */
	ISO_STRING = 'iso_string',
	/** Date string in YYYY-MM-DD format */
	DATE_STRING = 'date_string',
	/** UNIX timestamp in milliseconds */
	EPOCH_MS = 'epoch_ms',
}

/**
 * Configuration options for parsing dates
 */
interface DateParserOptions {
	/** Output format type */
	outputFormat?: DateFormatType
	/** Whether to include timezone offset in ISO strings */
	includeOffset?: boolean
	/** Custom format function */
	formatFn?: (date: Date) => string | number
}

/**
 * Default options for date parsing
 */
const DEFAULT_OPTIONS: DateParserOptions = {
	outputFormat: DateFormatType.DATE_OBJECT,
	includeOffset: true,
}

/**
 * Type guard to check if a value is a valid epoch timestamp in milliseconds
 */
function isEpochMilliseconds(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Parses a Schwab date into a standardized format
 * This function accepts epoch timestamps, ISO strings, or Date objects
 * and returns the date in the specified format.
 *
 * @param value - The date value to parse
 * @param options - Configuration options
 * @returns The date in the specified format
 */
function parseSchwabDate(
	value: SchwabDate | null | undefined,
	options: DateParserOptions = DEFAULT_OPTIONS,
): Date | string | number | null {
	if (value === null || value === undefined) {
		return null
	}

	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
	let date: Date

	// Convert input to Date object
	if (value instanceof Date) {
		date = value
	} else if (isEpochMilliseconds(value)) {
		date = new Date(value)
	} else if (typeof value === 'string') {
		// Try to parse the string as a date
		date = new Date(value)
	} else {
		throw new Error(`Unsupported date format: ${typeof value}`)
	}

	// Handle invalid dates
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date: ${value}`)
	}

	// Return in requested format
	if (mergedOptions.formatFn) {
		return mergedOptions.formatFn(date)
	}

	switch (mergedOptions.outputFormat) {
		case DateFormatType.DATE_OBJECT:
			return date
		case DateFormatType.ISO_STRING:
			return mergedOptions.includeOffset ? date.toISOString() : date.toJSON()
		case DateFormatType.DATE_STRING: {
			const parts = date.toISOString().split('T')
			return parts[0] ?? null
		}
		case DateFormatType.EPOCH_MS:
			return date.getTime()
		default:
			return date as Date | string | number
	}
}

/**
 * Zod schema for validating and transforming Unix timestamp in milliseconds
 */
export const epochMillisSchema = z
	.number()
	.int()
	.transform((value) =>
		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
	)

/**
 * Zod schema for validating and transforming ISO 8601 date strings
 */
export const isoDateTimeSchema = z
	.string()
	.datetime()
	.transform((value) =>
		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
	)

/**
 * Zod schema for validating and transforming YYYY-MM-DD date strings
 */
export const dateStringSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
	.transform((value) =>
		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
	)

/**
 * Creates a Zod schema for query parameter dates that accepts:
 * - UNIX epoch milliseconds (number)
 * - YYYY-MM-DD formatted strings
 * - null values
 *
 * All values are transformed to UNIX epoch milliseconds or undefined (if null/undefined)
 * for API compatibility.
 *
 * @returns A Zod schema for query parameter dates
 */
export function createQueryDateSchema() {
	return z
		.union([
			z.number().int(),
			z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
			z.null(),
		])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) {
				return undefined
			}
			if (typeof val === 'string') {
				return new Date(val).getTime()
			}
			// For number type, ensure it's an epoch milliseconds value
			return val
		})
}
