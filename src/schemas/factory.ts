import { z, type ZodType } from 'zod'

/**
 * Factory function to create common error schema
 */
export function createErrorSchema(
	additionalFields: Record<string, ZodType> = {},
): ZodType {
	return z.object({
		error: z.string(),
		error_description: z.string().optional(),
		status: z.number().optional(),
		...additionalFields,
	})
}
