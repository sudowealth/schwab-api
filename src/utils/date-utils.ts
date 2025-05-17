import { z } from 'zod'

/**
 * SchawbDate utility type
 * This type can be used to represent a Schwab date in any of its forms
 */
export type SchwabDate = Date | string | number

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
export interface DateParserOptions {
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
 * Type guard to check if a value is a valid date string (YYYY-MM-DD)
 */
export function isDateString(value: unknown): value is string {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * Type guard to check if a value is a valid ISO 8601 date string
 */
export function isISODateString(value: unknown): value is string {
	if (typeof value !== 'string') return false
	try {
		// ISO string is strictly formatted, checking Date.parse is not enough
		const regex =
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/
		return regex.test(value) && !isNaN(Date.parse(value))
	} catch {
		return false
	}
}

/**
 * Type guard to check if a value is a valid epoch timestamp in milliseconds
 */
export function isEpochMilliseconds(value: unknown): value is number {
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
export function parseSchwabDate(
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
	if (isNaN(date.getTime())) {
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
		case DateFormatType.DATE_STRING:
			const parts = date.toISOString().split('T')
			return parts[0] ?? null
		case DateFormatType.EPOCH_MS:
			return date.getTime()
		default:
			return date as Date | string | number
	}
}

/**
 * Zod transformer for date fields
 * Can be used in schemas to automatically transform date fields
 *
 * @example
 * const schema = z.object({
 *   timestamp: z.number().transform(dateTransformer())
 * })
 *
 * @param options - Options for date transformation
 * @returns A zod transformer function
 */
export function dateTransformer(options: DateParserOptions = DEFAULT_OPTIONS) {
	return (value: SchwabDate | null | undefined) =>
		parseSchwabDate(value, options)
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
 * Creates a Zod schema that can handle multiple date formats
 *
 * @param options - Options for date transformation
 * @returns A zod schema that can handle multiple date formats
 */
export function createFlexibleDateSchema(
	options: DateParserOptions = DEFAULT_OPTIONS,
) {
	return z.union([
		z.date(),
		z
			.number()
			.int()
			.transform((val) => parseSchwabDate(val, options)),
		z.string().transform((val) => parseSchwabDate(val, options)),
	])
}

/**
 * Gets the current date in the specified format
 *
 * @param options - Configuration options
 * @returns The current date in the specified format
 */
export function getCurrentDate(
	options: DateParserOptions = DEFAULT_OPTIONS,
): Date | string | number {
	return parseSchwabDate(new Date(), options) as Date | string | number
}

/**
 * Formats a date as an ISO string with the specified precision
 *
 * @param date - The date to format
 * @param precision - The number of decimal places for milliseconds (0-3)
 * @returns The formatted ISO string
 */
export function formatISOWithPrecision(
	date: SchwabDate,
	precision: number = 3,
): string {
	const dateObj = parseSchwabDate(date, {
		outputFormat: DateFormatType.DATE_OBJECT,
	}) as Date

	if (precision === 0) {
		// No milliseconds
		return dateObj.toISOString().replace(/\.\d{3}Z$/, 'Z')
	} else if (precision > 0 && precision < 3) {
		// Truncate milliseconds to the specified precision
		const isoString = dateObj.toISOString()
		const millisPart = isoString.substring(
			isoString.lastIndexOf('.') + 1,
			isoString.lastIndexOf('Z'),
		)
		const truncatedMillis = millisPart.substring(0, precision)
		return isoString.replace(millisPart, truncatedMillis)
	}

	// Default full precision
	return dateObj.toISOString()
}
