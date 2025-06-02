import { type z } from 'zod'

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
	return shapes.reduce((acc, shape) => ({ ...acc, ...shape }), {})
}
