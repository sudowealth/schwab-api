# Date/Time Handling in Schwab API

This document provides guidelines for handling date and time values in the
Schwab API library.

## Overview

The Schwab API standardizes date/time fields to ensure consistent usage across
the entire library. Instead of using various date formats (numeric epoch times
or ISO 8601 strings with possible offsets) directly, we use a utility layer that
converts all dates to a standardized representation.

## Date Utility Module

The `date-utils.ts` module provides standardized date handling functionality:

```typescript
import { DateFormatType, parseSchwabDate } from '../utils/date-utils'
```

### Key Components

1. **SchwabDate Type**:

   ```typescript
   type SchwabDate = Date | string | number
   ```

   This type represents a date in any of its forms (Date object, string, or
   number).

2. **DateFormatType Enum**:

   ```typescript
   enum DateFormatType {
   	DATE_OBJECT = 'date_object',
   	ISO_STRING = 'iso_string',
   	DATE_STRING = 'date_string',
   	EPOCH_MS = 'epoch_ms',
   }
   ```

   Defines the supported output formats for dates.

3. **parseSchwabDate Function**:

   ```typescript
   function parseSchwabDate(
   	value: SchwabDate | null | undefined,
   	options?: DateParserOptions,
   ): Date | string | number | null
   ```

   The core function that accepts any date format and converts it to the
   specified format.

4. **Zod Transformers**:

   ```typescript
   // For epoch milliseconds
   const epochMillisSchema = z
   	.number()
   	.int()
   	.transform((value) =>
   		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
   	)

   // For ISO date strings
   const isoDateTimeSchema = z
   	.string()
   	.datetime()
   	.transform((value) =>
   		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
   	)

   // For date strings (YYYY-MM-DD)
   const dateStringSchema = z
   	.string()
   	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
   	.transform((value) =>
   		parseSchwabDate(value, { outputFormat: DateFormatType.DATE_OBJECT }),
   	)
   ```

   These schemas validate and transform date values in Zod schemas.

## Usage Guidelines

1. **In Schema Definitions**:

   - Use `epochMillisSchema` for fields that represent timestamps in
     milliseconds
   - Use `isoDateTimeSchema` for fields that represent ISO 8601 date strings
   - Use `dateStringSchema` for fields that represent date strings in YYYY-MM-DD
     format

2. **In Type Definitions**:

   - Define date fields with the appropriate type (typically `Date` after
     transformation)

3. **In API Client Code**:
   - Use the `parseSchwabDate` function to convert dates to the desired format
   - Specify the output format using the `DateFormatType` enum

## Examples

### Schema Definition

```typescript
import { z } from 'zod'
import { epochMillisSchema, dateStringSchema } from '../utils/date-utils'

export const PriceHistoryCandleSchema = z.object({
	// Fields with numeric timestamps are transformed to Date objects
	datetime: epochMillisSchema.describe('Timestamp in EPOCH milliseconds'),

	// Fields with date strings are transformed to Date objects
	datetimeISO8601: dateStringSchema
		.optional()
		.describe('Timestamp in YYYY-MM-DD format'),
})
```

### API Client Code

```typescript
import { parseSchwabDate, DateFormatType } from '../utils/date-utils'

// Convert an epoch timestamp to an ISO string
const isoString = parseSchwabDate(1632150000000, {
	outputFormat: DateFormatType.ISO_STRING,
})

// Convert an ISO string to a Date object
const dateObj = parseSchwabDate('2021-09-20T15:30:00Z', {
	outputFormat: DateFormatType.DATE_OBJECT,
})

// Convert a date string to an epoch timestamp
const epochMs = parseSchwabDate('2021-09-20', {
	outputFormat: DateFormatType.EPOCH_MS,
})
```

## Benefits

1. **Consistency**: All date fields are handled consistently throughout the
   codebase
2. **Type Safety**: Date fields have well-defined types
3. **Flexibility**: Dates can be easily converted between different formats
4. **Validation**: Date values are validated before use
5. **Standardization**: Reduces confusion when working with multi-timezone or
   multi-format systems

## Note on Date Format Preferences

By standardizing dates to Date objects in our schemas, we provide the maximum
flexibility for consumers of our API. The consumers can then format the dates as
needed (ISO strings, epoch timestamps, etc.) without losing information.
