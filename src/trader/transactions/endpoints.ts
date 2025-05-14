import { Transaction, TransactionType, Transactions } from '../../schemas'
import { createEndpoint } from '../../core/http'
import { z } from 'zod'

export type GetTransactionsRequestPathParams = {
	accountId: string // Hashed Account ID
}
export type GetTransactionsRequestQueryParams = {
	startDate: string // ISO8601 Date Format YYYY-MM-DD
	endDate: string // ISO8601 Date Format YYYY-MM-DD
	types?: TransactionType
	symbol?: string
}

export const getTransactions = createEndpoint<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	Transactions,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountId/transactions',
	pathSchema: z.object({ accountId: z.string() }),
	querySchema: z.object({
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Basic YYYY-MM-DD validation
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Basic YYYY-MM-DD validation
		types: TransactionType.optional(),
		symbol: z.string().optional(),
	}),
	responseSchema: Transactions,
	description:
		'Retrieves transactions for a specific account within a date range.',
})

export type GetTransactionByIdRequestPathParams = {
	accountId: string // Hashed Account ID
	transactionId: string // Transaction ID
}

export const getTransactionById = createEndpoint<
	GetTransactionByIdRequestPathParams,
	never, // No query params for this endpoint
	never,
	Transaction,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountId/transactions/:transactionId',
	pathSchema: z.object({
		accountId: z.string(),
		transactionId: z.number().int(),
	}),
	responseSchema: Transaction,
	description:
		'Retrieves a specific transaction by its ID for a given account.',
})
