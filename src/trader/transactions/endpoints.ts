import { createEndpoint } from '../../core/http'
import { z } from 'zod'

const TransactionsArraySchema = z.array(z.any())

export type GetTransactionsRequestPathParams = {
	accountId: string // Hashed Account ID
}
export type GetTransactionsRequestQueryParams = {
	startDate: string // ISO8601 Date Format YYYY-MM-DD
	endDate: string // ISO8601 Date Format YYYY-MM-DD
	types?: string // Example: TRADE,RECEIVE_AND_DELIVER
	symbol?: string
}
export type GetTransactionsResponseBody = z.infer<
	typeof TransactionsArraySchema
>

export const getTransactions = createEndpoint<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	GetTransactionsResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountId/transactions',
	pathSchema: z.object({ accountId: z.string() }),
	querySchema: z.object({
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Basic YYYY-MM-DD validation
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Basic YYYY-MM-DD validation
		types: z.string().optional(),
		symbol: z.string().optional(),
	}),
	responseSchema: TransactionsArraySchema,
	description:
		'Retrieves transactions for a specific account within a date range.',
})
