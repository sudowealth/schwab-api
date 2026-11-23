import { z } from 'zod'

type EnumSchema<Value extends string> = z.ZodEnum<{ [K in Value]: K }>

// Zod methods such as describe() return a fresh schema without the SDK alias.
export type SdkEnum<Value extends string> = Pick<
	EnumSchema<Value>,
	keyof z.ZodEnum
> & {
	/** @deprecated Use the Zod 4 `.enum` property. */
	readonly Enum: { [K in Value]: K }
}

export function sdkEnum<const Value extends string>(
	values: readonly Value[],
): SdkEnum<Value> {
	const schema = z.enum(values)
	return Object.defineProperty(schema, 'Enum', {
		get: () => schema.enum,
	}) as SdkEnum<Value>
}

export function mergeShapes<T extends z.ZodRawShape, U extends z.ZodRawShape>(
	shape1: T,
	shape2: U,
): T & U
export function mergeShapes<
	T extends z.ZodRawShape,
	U extends z.ZodRawShape,
	V extends z.ZodRawShape,
>(shape1: T, shape2: U, shape3: V): T & U & V
export function mergeShapes<T extends z.ZodRawShape[]>(
	...shapes: T
): z.ZodRawShape {
	const merged: z.ZodRawShape = {}
	for (const shape of shapes) {
		Object.assign(merged, shape)
	}
	return merged
}
